package household.account.web.repository;

import household.account.web.domain.category.Category;

import java.util.List;
import java.util.Optional;

public interface CategoryCustomRepository {
    Optional<Category> findCategoryById(Integer id);
    Optional<Category> findParentByName(String name);
    Optional<List<Category>> findParentByOrderNumGoe(Integer orderNum);
    Long findParentCategoryCount();
    Optional<List<Category>> findParentCategoryListByOrderNumGoeAndLt(Integer newOrderNum, Integer originalOrderNum);
    Optional<List<Category>> findParentCategoryListByOrderNumGtAndLoe(Integer originalOrderNum, Integer newOrderNum);
    Optional<List<Category>> findParentCategoryListByDataStatusNotAndOrderNumGt(Integer orderNum);
    Optional<List<Category>> findParentCategoryList();
    Optional<Category> findByNameAndParentId(String name, Integer parentId);
    Optional<List<Category>> findByNameAndParentIdOrderNumGoe(String name, Integer parentId, Integer orderNum);
    Long findByParentIdCount(Integer parentId);
    Optional<List<Category>> findCategoryListByParentId(Integer parentId);
    Optional<List<Category>> findByDataStatusNotParentId(Integer parentId);
    Optional<List<Category>> findCategoryListByParentIdAndOrderNumGoeAndLt(Integer parentId, Integer newOrderNum, Integer originalOrderNum);
    Optional<List<Category>> findCategoryListByParentIdAndOrderNumGtAndLoe(Integer parentId, Integer originalOrderNum, Integer newOrderNum);
    Optional<List<Category>> findCategoryListByParentIdAndDataStatusNotAndOrderNumGt(Integer parentId, Integer orderNum);
}
