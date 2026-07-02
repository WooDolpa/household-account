package household.account.web.service;

import household.account.web.domain.category.Category;
import household.account.web.domain.receipt.Receipt;
import household.account.web.dto.ReceiptDto;
import household.account.web.enums.DataStatus;
import household.account.web.enums.Installment;
import household.account.web.enums.PaymentType;
import household.account.web.enums.ReceiptType;
import household.account.web.exception.CustomException;
import household.account.web.exception.ExceptionCode;
import household.account.web.repository.category.CategoryRepository;
import household.account.web.repository.receipt.ReceiptRepository;
import household.account.web.utils.ExcelUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReceiptService {

    private final ReceiptRepository receiptRepository;
    private final CategoryRepository categoryRepository;
    private final ExcelUtils excelUtils;

    /**
     * 사용내역 등록
     *
     * @param dto
     */
    @Transactional
    public void saveReceipt(ReceiptDto.RegDto dto) {

        Category findParentCategory = categoryRepository.findCategoryById(dto.getParentCategoryId())
                .orElseThrow(() -> new CustomException(ExceptionCode.PARENT_CATEGORY_NOT_FOUND));

        Category findCategory = null;
        if(dto.getCategoryId() != null) {
            findCategory = categoryRepository.findCategoryById(dto.getCategoryId())
                    .orElse(null);
        }

        ReceiptType receiptType = ReceiptType.findReceiptType(dto.getReceiptType());
        PaymentType paymentType = PaymentType.findPaymentType(dto.getPaymentType());
        Installment installment = Installment.findByInstallment(dto.getInstallment());

        Receipt receipt = Receipt.builder()
                .name(dto.getName())
                .receiptType(receiptType)
                .paymentType(paymentType)
                .installment(installment)
                .parentCategory(findParentCategory)
                .category(findCategory)
                .amount(dto.getAmount())
                .usedDate(dto.getUsedDate())
                .dataStatus(DataStatus.YES)
                .build();

        receiptRepository.save(receipt);
    }

    /**
     * 사용내역 일괄등록
     *
     * @param dto
     */
    @Transactional
    public void saveBulkReceipt(ReceiptDto.BulkRegDto dto) {
        List<ReceiptDto.RegDto> receipts = dto.getReceipts();
        for (ReceiptDto.RegDto receipt : receipts) {
            saveReceipt(receipt);
        }
    }

    /**
     * 엑셀파일 대량 저장
     *
     * @param file
     */
    @Transactional
    public void saveReceiptExcel(MultipartFile file) {

        Map<String, Category> parentMap = categoryRepository.findParentCategoryList()
                .orElseGet(List::of).stream()
                .collect(Collectors.toMap(Category::getName, Function.identity(), (a, b) -> a));

        Map<String, Category> childMap =  categoryRepository.findCategoryList()
                .orElseGet(List::of).stream()
                .collect(Collectors.toMap(c -> c.getParentId() + ":" + c.getName(), Function.identity(), (a, b) -> a));

        List<ReceiptDto.RegDto> receipts = excelUtils.excelConverter(file, parentMap, childMap);
        saveBulkReceipt(new ReceiptDto.BulkRegDto(receipts));
    }

    /**
     * 사용내역 조회
     *
     * @param startDate
     * @param endDate
     * @param parentCategoryId
     * @param categoryId
     * @param name
     * @param page
     * @param size
     * @return
     */
    public ReceiptDto.ListDto findReceiptList(String startDate, String endDate, Integer parentCategoryId, Integer categoryId, String name, Integer page, Integer size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<Receipt> receiptPage = receiptRepository.findReceiptList(startDate, endDate, parentCategoryId, categoryId, name, pageable);

        List<ReceiptDto.ResDto> list = receiptPage.getContent().stream()
                .map(r -> ReceiptDto.ResDto.builder()
                        .id(r.getId())
                        .name(r.getName())
                        .receiptType(r.getReceiptType().getKey())
                        .paymentType(r.getPaymentType().getKey())
                        .installment(r.getInstallment().getKey())
                        .parentCategoryId(r.getParentCategory().getId())
                        .categoryId(r.getCategory() != null ? r.getCategory().getId() : null)
                        .amount(r.getAmount())
                        .usedDate(r.getUsedDate())
                        .build())
                .toList();

        return ReceiptDto.ListDto.builder()
                .data(list)
                .totalPages(receiptPage.getTotalPages())
                .totalElements(Long.valueOf(receiptPage.getTotalElements()).intValue())
                .currentPage(page)
                .pageSize(size)
                .build();
    }

    /**
     * 사용내역 수정
     *
     * @param dto
     */
    @Transactional
    public void updateReceipt(ReceiptDto.UpdateDto dto) {

        Receipt findReceipt = receiptRepository.findById(dto.getId())
                .orElseThrow(() -> new CustomException(ExceptionCode.RECEIPT_NOT_FOUND));

        ReceiptType receiptType = ReceiptType.findReceiptType(dto.getReceiptType());
        PaymentType paymentType = PaymentType.findPaymentType(dto.getPaymentType());
        Installment installment = Installment.findByInstallment(dto.getInstallment());

        Category parentCategory = categoryRepository.findById(dto.getParentCategoryId())
                .orElseThrow(() -> new CustomException(ExceptionCode.PARENT_CATEGORY_NOT_FOUND));

        Category category = null;
        if(dto.getCategoryId() != null) {
            category = categoryRepository.findById(dto.getCategoryId())
                    .orElse(null);
        }


        findReceipt.changeName(dto.getName());
        findReceipt.changeReceiptType(receiptType);
        findReceipt.changePaymentType(paymentType);
        findReceipt.changeInstallment(installment);
        findReceipt.changeAmount(dto.getAmount());
        findReceipt.changeUsedDate(dto.getUsedDate());
        findReceipt.changeParentCategory(parentCategory);
        findReceipt.changeCategory(category);
    }
}
