package household.account.web.service;

import household.account.web.domain.category.Category;
import household.account.web.domain.receipt.Receipt;
import household.account.web.dto.ApiResponseDto;
import household.account.web.dto.ReceiptDto;
import household.account.web.enums.DataStatus;
import household.account.web.enums.Installment;
import household.account.web.enums.PaymentType;
import household.account.web.enums.ReceiptType;
import household.account.web.exception.CustomException;
import household.account.web.exception.ExceptionCode;
import household.account.web.repository.category.CategoryRepository;
import household.account.web.repository.receipt.ReceiptRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReceiptService {

    private final ReceiptRepository receiptRepository;
    private final CategoryRepository categoryRepository;

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
        Installment installment = Installment.findByKey(dto.getInstallment());

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
}
