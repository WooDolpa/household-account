package household.account.web.repository;

import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import household.account.web.domain.category.Category;
import household.account.web.enums.DataStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Optional;

import static household.account.web.domain.category.QCategory.category;

@RequiredArgsConstructor
public class CategoryRepositoryImpl implements CategoryCustomRepository {

    private final JPAQueryFactory factory;


    @Override
    public Optional<Category> findParentByName(String name) {

        Category findCategory = factory.select(category)
                .from(category)
                .where(
                        category.parentId.isNull(),
                        matchName(name)
                )
                .fetchOne();

        return Optional.ofNullable(findCategory);
    }

    @Override
    public Optional<List<Category>> findParentByOrderNumGoe(Integer orderNum) {

        List<Category> list = factory.select(category)
                .from(category)
                .where(
                        category.parentId.isNull(),
                        category.dataStatus.ne(DataStatus.No),
                        matchOrderNumGoe(orderNum)
                )
                .orderBy(category.orderNum.asc())
                .fetch();

        return Optional.ofNullable(list);
    }

    @Override
    public Long findParentCategoryCount() {

        Long totalCount = factory.select(category.count())
                .from(category)
                .where(
                        category.parentId.isNull(),
                        category.dataStatus.ne(DataStatus.No)
                )
                .fetchOne();

        return (totalCount != null) ? totalCount : 0L;
    }

    @Override
    public Optional<List<Category>> findParentCategoryList() {

        List<Category> list = factory.select(category)
                .from(category)
                .where(
                        category.parentId.isNull(),
                        category.dataStatus.ne(DataStatus.No)
                )
                .orderBy(category.orderNum.asc())
                .fetch();

        return Optional.ofNullable(list);
    }

    @Override
    public Optional<Category> findByNameAndParentId(String name, Integer parentId) {

        Category findCategory = factory.select(category)
                .from(category)
                .where(
                        matchParentId(parentId),
                        category.dataStatus.ne(DataStatus.No),
                        matchName(name)
                )
                .fetchOne();

        return Optional.ofNullable(findCategory);
    }

    @Override
    public Optional<List<Category>> findByNameAndParentIdOrderNumGoe(String name, Integer parentId, Integer orderNum) {

        List<Category> list = factory.select(category)
                .from(category)
                .where(
                        matchParentId(parentId),
                        category.dataStatus.ne(DataStatus.No),
                        matchName(name)
                )
                .orderBy(category.orderNum.asc())
                .fetch();

        return Optional.ofNullable(list);
    }

    @Override
    public Long findByParentIdCount(Integer parentId) {

        Long totalCount = factory.select(category.count())
                .from(category)
                .where(
                        matchParentId(parentId),
                        category.dataStatus.ne(DataStatus.No)
                )
                .fetchOne();

        return (totalCount != null) ? totalCount : 0L;
    }

    @Override
    public Optional<List<Category>> findCategoryListByParentId(Integer parentId) {

        List<Category> list = factory.select(category)
                .from(category)
                .where(
                        matchParentId(parentId),
                        category.dataStatus.ne(DataStatus.No)
                )
                .orderBy(category.orderNum.asc())
                .fetch();

        return Optional.ofNullable(list);
    }

    private BooleanExpression matchName(String name) {
        if(StringUtils.hasText(name)) {
            return category.name.eq(name);
        }
        return null;
    }

    private BooleanExpression matchOrderNumGoe(Integer orderNum) {
        if(orderNum != null) {
            return category.orderNum.goe(orderNum);
        }
        return null;
    }

    private BooleanExpression matchParentId(Integer parentId) {
        if(parentId != null) {
            return category.parentId.eq(parentId);
        }
        return null;
    }
}
