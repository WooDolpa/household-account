package household.account.web.domain.receipt;

import household.account.web.converter.DataStatusConverter;
import household.account.web.converter.ReceiptTypeConverter;
import household.account.web.domain.BaseEntity;
import household.account.web.domain.category.Category;
import household.account.web.enums.DataStatus;
import household.account.web.enums.ReceiptType;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

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

    @Column(name = "amount", comment = "금액")
    private Integer amount;

    @Column(name = "used_date", length = 8, comment = "사용일")
    private String usedDate;

    @Convert(converter = DataStatusConverter.class)
    @Column(name = "data_status", nullable = false, comment = "데이터 상태")
    private DataStatus dataStatus;

    @ManyToOne(fetch = LAZY)
    @JoinColumn(name = "category_id", comment = "카테고리 아이디")
    private Category category;

    @Builder
    public Receipt(Integer id, String name, ReceiptType receiptType, Integer amount, String usedDate, DataStatus dataStatus, Category category) {
        this.id = id;
        this.name = name;
        this.receiptType = receiptType;
        this.amount = amount;
        this.usedDate = usedDate;
        this.dataStatus = dataStatus;
        this.category = category;
    }
}
