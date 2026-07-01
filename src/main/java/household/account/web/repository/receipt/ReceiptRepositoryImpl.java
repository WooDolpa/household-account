package household.account.web.repository.receipt;

import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import household.account.web.domain.receipt.Receipt;
import household.account.web.enums.DataStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.support.PageableExecutionUtils;
import org.springframework.util.StringUtils;

import java.util.List;

import static household.account.web.domain.receipt.QReceipt.receipt;

@RequiredArgsConstructor
public class ReceiptRepositoryImpl implements ReceiptCustomRepository {

    private final JPAQueryFactory factory;


    @Override
    public Page<Receipt> findReceiptList(String startDate, String endDate, Integer parentCategoryId, Integer categoryId, String name, Pageable pageable) {

        List<Receipt> list = factory.select(receipt)
                .from(receipt)
                .where(
                        receipt.dataStatus.eq(DataStatus.YES),
                        matchUsedDateGoe(startDate),
                        matchUsedDateLoe(endDate),
                        matchParentCategoryIdEq(parentCategoryId),
                        matchCategoryIdEq(categoryId),
                        matchNameEq(name)
                )
                .orderBy(receipt.usedDate.asc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        JPAQuery<Long> countQuery = factory.select(receipt.count())
                .from(receipt)
                .where(
                        receipt.dataStatus.eq(DataStatus.YES),
                        matchUsedDateGoe(startDate),
                        matchUsedDateLoe(endDate),
                        matchParentCategoryIdEq(parentCategoryId),
                        matchCategoryIdEq(categoryId),
                        matchNameEq(name)
                );

        return PageableExecutionUtils.getPage(list, pageable, countQuery::fetchOne);
    }

    private BooleanExpression matchUsedDateGoe(String usedDate) {
        if(StringUtils.hasText(usedDate)) {
            return receipt.usedDate.goe(usedDate);
        }
        return null;
    }

    private BooleanExpression matchUsedDateLoe(String usedDate) {
        if(StringUtils.hasText(usedDate)) {
            return receipt.usedDate.loe(usedDate);
        }
        return null;
    }

    private BooleanExpression matchParentCategoryIdEq(Integer parentCategoryId) {
        if(parentCategoryId != null) {
            return receipt.parentCategory.id.eq(parentCategoryId);
        }
        return null;
    }

    private BooleanExpression matchCategoryIdEq(Integer categoryId) {
        if(categoryId != null) {
            return receipt.category.id.eq(categoryId);
        }
        return null;
    }

    private BooleanExpression matchNameEq(String name) {
        if(StringUtils.hasText(name)) {
            return receipt.name.eq(name);
        }
        return null;
    }
}
