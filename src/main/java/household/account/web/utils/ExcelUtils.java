package household.account.web.utils;

import household.account.web.domain.category.Category;
import household.account.web.dto.ReceiptDto;
import household.account.web.exception.CustomException;
import household.account.web.exception.ExceptionCode;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Component
public class ExcelUtils {

    private static final int EXCEL_COLUMN_COUNT = 8;
    private static final Pattern INSTALLMENT_PATTERN = Pattern.compile("^(\\d{1,2})개월$");


    public List<ReceiptDto.RegDto> excelConverter(MultipartFile file, Map<String, Category> parentMap, Map<String, Category> childMap) {

        List<ReceiptDto.RegDto> receipts = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        String fileName = file.getOriginalFilename();
        if (file.isEmpty() || fileName == null || !fileName.toLowerCase().endsWith(".xlsx")) {
            throw new CustomException(ExceptionCode.EXCEL_FILE_INVALID);
        }

        try (Workbook wb = WorkbookFactory.create(file.getInputStream())) {

            DataFormatter fmt = new DataFormatter();
            Sheet sheet = wb.getSheetAt(0);

            for (Row row : sheet) {
                if (row.getRowNum() == 0) continue;
                if (isBlankRow(row, fmt)) continue;
                parseRow(row, fmt, parentMap, childMap, receipts, errors);
            }

        }catch (Exception e) {
            throw new CustomException(ExceptionCode.EXCEL_PARSE_FAIL);
        }

        if(!errors.isEmpty()) {
            String message = errors.stream().limit(5).collect(Collectors.joining("\n"));
            if (errors.size() > 5) {
                message += "\n외 " + (errors.size() - 5) + "건";
            }
            throw new CustomException(ExceptionCode.EXCEL_ROW_INVALID, message);
        }

        if(receipts.isEmpty()) {
            throw new CustomException(ExceptionCode.EXCEL_EMPTY);
        }

        return receipts;
    }

    private void parseRow(Row row, DataFormatter fmt, Map<String, Category> parentMap, Map<String, Category> childMap, List<ReceiptDto.RegDto> receipts, List<String> errors) {

        int rowNo = row.getRowNum() + 1;

        String usedDate   = readDateCell(row.getCell(0), fmt);
        String name       = fmt.formatCellValue(row.getCell(1)).trim();
        String amountStr  = fmt.formatCellValue(row.getCell(2)).replace(",", "").trim();
        String typeLabel  = fmt.formatCellValue(row.getCell(3)).trim();
        String parentName = fmt.formatCellValue(row.getCell(4)).trim();
        String childName  = fmt.formatCellValue(row.getCell(5)).trim();
        String payLabel   = fmt.formatCellValue(row.getCell(6)).trim();
        String instLabel  = fmt.formatCellValue(row.getCell(7)).trim();

        if (usedDate == null) {
            errors.add(rowNo + "행: 사용일이 올바르지 않습니다.");
            return;
        }
        if (name.isEmpty()) {
            errors.add(rowNo + "행: 사용명이 없습니다.");
            return;
        }
        if (name.length() > 32) {
            errors.add(rowNo + "행: 사용명은 32자 이하여야 합니다.");
            return;
        }
        if (!amountStr.matches("\\d{1,9}")) {
            errors.add(rowNo + "행: 금액이 올바르지 않습니다.");
            return;
        }
        if (!"고정".equals(typeLabel) && !"일회성".equals(typeLabel)) {
            errors.add(rowNo + "행: 사용구분은 '고정' 또는 '일회성'이어야 합니다.");
            return;
        }
        if (!"카드".equals(payLabel) && !"현금".equals(payLabel)) {
            errors.add(rowNo + "행: 결제수단은 '카드' 또는 '현금'이어야 합니다.");
            return;
        }

        Category parent = parentMap.get(parentName);
        if (parent == null) {
            errors.add(rowNo + "행: 대분류 '" + parentName + "'를 찾을 수 없습니다.");
            return;
        }

        Category child = null;
        if (!childName.isEmpty()) {
            child = childMap.get(parent.getId() + ":" + childName);
            if (child == null) {
                errors.add(rowNo + "행: 소분류 '" + childName + "'를 찾을 수 없습니다.");
                return;
            }
        }

        String receiptType = "고정".equals(typeLabel) ? "F" : "O";
        String paymentType = "현금".equals(payLabel) ? "M" : "C";

        String installment = toInstallmentKey(instLabel, paymentType);
        if (installment == null) {
            errors.add(rowNo + "행: 할부 '" + instLabel + "'가 올바르지 않습니다.");
            return;
        }

        receipts.add(ReceiptDto.RegDto.builder()
                .name(name)
                .receiptType(receiptType)
                .paymentType(paymentType)
                .installment(installment)
                .amount(Integer.parseInt(amountStr))
                .usedDate(usedDate)
                .parentCategoryId(parent.getId())
                .categoryId(child != null ? child.getId() : null)
                .build());
    }

    private String readDateCell(Cell cell, DataFormatter formatter) {
        if (cell == null) {
            return null;
        }
        if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
            return cell.getLocalDateTimeCellValue().format(DateTimeFormatter.BASIC_ISO_DATE);
        }
        String value = formatter.formatCellValue(cell).trim().replaceAll("[.\\-/\\s]", "");
        try {
            LocalDate.parse(value, DateTimeFormatter.BASIC_ISO_DATE);
        } catch (DateTimeParseException e) {
            return null;
        }
        return value;
    }

    private String toInstallmentKey(String label, String paymentType) {
        // 현금은 무조건 일시불 (등록 모달과 동일 규칙)
        if ("M".equals(paymentType)) {
            return "001";
        }
        if (label.isEmpty() || "일시불".equals(label)) {
            return "001";
        }
        Matcher matcher = INSTALLMENT_PATTERN.matcher(label);
        if (matcher.matches()) {
            int months = Integer.parseInt(matcher.group(1));
            if (months >= 2 && months <= 12) {
                return String.format("%03d", months);
            }
        }
        return null;
    }

    private boolean isBlankRow(Row row, DataFormatter formatter) {
        for (int i = 0; i < EXCEL_COLUMN_COUNT; i++) {
            if (!formatter.formatCellValue(row.getCell(i)).trim().isEmpty()) {
                return false;
            }
        }
        return true;
    }
}
