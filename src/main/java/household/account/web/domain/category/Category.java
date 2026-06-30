package household.account.web.domain.category;

import household.account.web.converter.DataStatusConverter;
import household.account.web.domain.BaseEntity;
import household.account.web.enums.DataStatus;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import static jakarta.persistence.GenerationType.IDENTITY;

@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Entity
@Table(name = "category")
public class Category extends BaseEntity {

    @Id
    @GeneratedValue(strategy = IDENTITY)
    private Integer id;

    @Column(name = "name", length = 32, comment = "카테고리 명")
    private String name;

    @Column(name = "parent_id", length = 11, comment = "상위 아이디")
    private Integer parentId;

    @Column(name = "order_num", length = 11, comment = "순번")
    private Integer orderNum;

    @Convert(converter = DataStatusConverter.class)
    @Column(name = "data_status", nullable = false, comment = "데이터 상태")
    private DataStatus dataStatus;

    @Builder
    public Category(Integer id, String name, Integer parentId, Integer orderNum, DataStatus dataStatus) {
        this.id = id;
        this.name = name;
        this.parentId = parentId;
        this.orderNum = orderNum;
        this.dataStatus = dataStatus;
    }

    public void increaseOrderNum() {
        this.orderNum++;
    }

    public void decreaseOrderNum() {
        this.orderNum--;
    }

    public void changeOrderNum(Integer orderNum) {
        if(orderNum != null) {
            this.orderNum = orderNum;
        }
    }

    public void changeName(String newName) {
        this.name = newName;
    }

    public void changeDataStatus(DataStatus dataStatus) {
        if(dataStatus != null) {
            this.dataStatus = dataStatus;
        }
    }

    public void delete() {
        this.orderNum = 0;
        this.dataStatus = DataStatus.NO;
    }
}
