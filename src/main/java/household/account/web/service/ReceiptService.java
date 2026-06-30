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
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

        Category findCategory = categoryRepository.findCategoryById(dto.getCategoryId())
                .orElseThrow(() -> new CustomException(ExceptionCode.CATEGORY_NOT_FOUND));

        ReceiptType receiptType = ReceiptType.findReceiptType(dto.getReceiptType());
        PaymentType paymentType = PaymentType.findPaymentType(dto.getPaymentType());
        Installment installment = Installment.findByKey(dto.getInstallment());

        Receipt receipt = Receipt.builder()
                .name(dto.getName())
                .receiptType(receiptType)
                .paymentType(paymentType)
                .installment(installment)
                .category(findCategory)
                .amount(dto.getAmount())
                .usedDate(dto.getUsedDate())
                .dataStatus(DataStatus.YES)
                .build();

        receiptRepository.save(receipt);
    }
}
