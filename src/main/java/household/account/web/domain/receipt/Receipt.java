package household.account.web.domain.receipt;

import household.account.web.converter.DataStatusConverter;
import household.account.web.converter.InstallmentConverter;
import household.account.web.converter.PaymentTypeConverter;
import household.account.web.converter.ReceiptTypeConverter;
import household.account.web.domain.BaseEntity;
import household.account.web.domain.category.Category;
import household.account.web.enums.DataStatus;
import household.account.web.enums.Installment;
import household.account.web.enums.PaymentType;
import household.account.web.enums.ReceiptType;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.util.StringUtils;

import static jakarta.persistence.FetchType.LAZY;
import static jakarta.persistence.GenerationType.IDENTITY;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "receipt")
public class Receipt extends BaseEntity {

    @Id
    @GeneratedValue(strategy = IDENTITY)
    private Integer id;

    @Column(name = "name", length = 32, comment = "사용명")
    private String name;

    @Convert(converter = ReceiptTypeConverter.class)
    @Column(name = "receipt_type", comment = "사용구분( F :  고정, O : 일회성)")
    private ReceiptType receiptType;

    @Convert(converter = PaymentTypeConverter.class)
    @Column(name = "payment_type", comment = "결제타입(C : 카드, M : 현금)")
    private PaymentType paymentType;

    @Convert(converter = InstallmentConverter.class)
    @Column(name = "installment", comment = "할부(001 : 일시불, 002 : 2개월 할부...)")
    private Installment installment;

    @Column(name = "amount", comment = "금액")
    private Integer amount;

    @Column(name = "used_date", length = 8, comment = "사용일")
    private String usedDate;

    @Convert(converter = DataStatusConverter.class)
    @Column(name = "data_status", nullable = false, comment = "데이터 상태")
    private DataStatus dataStatus;

    @ManyToOne(fetch = LAZY)
    @JoinColumn(name = "parent_category_id", comment = "대분류 카테고리 아이디", nullable = false)
    private Category parentCategory;

    @ManyToOne(fetch = LAZY)
    @JoinColumn(name = "category_id", comment = "소분류 카테고리 아이디")
    private Category category;

    @Builder
    public Receipt(Integer id, String name, ReceiptType receiptType, PaymentType paymentType, Installment installment, Integer amount, String usedDate, DataStatus dataStatus, Category parentCategory, Category category) {
        this.id = id;
        this.name = name;
        this.receiptType = receiptType;
        this.paymentType = paymentType;
        this.installment = installment;
        this.amount = amount;
        this.usedDate = usedDate;
        this.dataStatus = dataStatus;
        this.parentCategory = parentCategory;
        this.category = category;
    }

    public void changeName(String name) {
        if(StringUtils.hasText(name)) {
            this.name = name;
        }
    }

    public void changeReceiptType(ReceiptType receiptType) {
        if(receiptType != null) {
            this.receiptType = receiptType;
        }
    }

    public void changePaymentType(PaymentType paymentType) {
        if(paymentType != null) {
            this.paymentType = paymentType;
        }
    }

    public void changeInstallment(Installment installment) {
        if(installment != null) {
            this.installment = installment;
        }
    }

    public void changeAmount(Integer amount) {
        if(amount != null && amount > 0) {
            this.amount = amount;
        }
    }

    public void changeUsedDate(String usedDate) {
        if(StringUtils.hasText(usedDate)) {
            this.usedDate = usedDate;
        }
    }

    public void changeDataStatus(DataStatus dataStatus) {
        if(dataStatus != null) {
            this.dataStatus = dataStatus;
        }
    }

    public void changeParentCategory(Category parentCategory) {
        if(parentCategory != null) {
            this.parentCategory = parentCategory;
        }
    }

    public void changeCategory(Category category) {
        this.category = category;
    }
}
