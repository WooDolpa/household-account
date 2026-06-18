package household.account.web.repository;

import household.account.web.domain.category.Category;

import java.util.List;
import java.util.Optional;

public interface CategoryCustomRepository {
    Optional<Category> findParentByName(String name);
    Optional<List<Category>> findParentByOrderNumGoe(Integer orderNum);
    Long findParentCategoryCount();
    Optional<List<Category>> findParentCategoryList();
    Optional<Category> findByNameAndParentId(String name, Integer parentId);
    Optional<List<Category>> findByNameAndParentIdOrderNumGoe(String name, Integer parentId, Integer orderNum);
    Long findByParentIdCount(Integer parentId);
    Optional<List<Category>> findCategoryListByParentId(Integer parentId);
}
