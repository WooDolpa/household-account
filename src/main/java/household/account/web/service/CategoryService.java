package household.account.web.service;

import household.account.web.domain.category.Category;
import household.account.web.dto.CategoryDto;
import household.account.web.enums.DataStatus;
import household.account.web.enums.OrderType;
import household.account.web.exception.CustomException;
import household.account.web.exception.ExceptionCode;
import household.account.web.repository.category.CategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryService {

    private final CategoryRepository categoryRepository;

    /**
     * 대분류 등록
     *
     * @param dto
     */
    @Transactional
    public void saveParentCategory(CategoryDto.ParentCategoryRegDto dto) {

        Category findCategory = categoryRepository.findParentByName(dto.getName()).orElse(null);
        if(findCategory != null) {
            throw new CustomException(ExceptionCode.CATEGORY_ALREADY_EXIST);
        }

        OrderType orderType = OrderType.findOrderType(dto.getOrderType());
        Integer orderNum = dto.getOrderNum();

        if(OrderType.Manual.equals(orderType)) {
            // 순번 정리
            List<Category> list = categoryRepository.findParentByOrderNumGoe(dto.getOrderNum())
                    .orElse(new ArrayList<>());

            list.forEach(Category::increaseOrderNum);
        }else if(OrderType.Auto.equals(orderType)) {
            Long totalCount = categoryRepository.findParentCategoryCount();
            orderNum = (totalCount.intValue() + 1);
        }

        Category category = Category.builder()
                .name(dto.getName())
                .dataStatus(DataStatus.Yes)
                .orderNum(orderNum)
                .build();

        categoryRepository.save(category);
    }

    /**
     * 대분류 조회
     *
     * @return
     */
    public List<CategoryDto.ParentCategoryResDto> findParentCategoryList() {

        List<Category> categoryList = categoryRepository.findParentCategoryList()
                .orElse(new ArrayList<>());

        return categoryList.stream()
                .map(category -> {
                    return CategoryDto.ParentCategoryResDto.builder()
                            .id(category.getId())
                            .name(category.getName())
                            .parentId(category.getParentId())
                            .orderNum(category.getOrderNum())
                            .build();
                }).toList();
    }

    /**
     * 대분류 수정
     *
     * @param dto
     */
    @Transactional
    public void updateParentCategory(CategoryDto.ParentCategoryUpdDto dto) {

        Category findCategory = categoryRepository.findById(dto.getId())
                .orElseThrow(() -> new CustomException(ExceptionCode.PARENT_CATEGORY_NOT_FOUND));

        Integer originalOrderNum = findCategory.getOrderNum();
        Integer newOrderNum = dto.getOrderNum();

        if(!Objects.equals(originalOrderNum, newOrderNum)) {
            if(originalOrderNum > newOrderNum) {
                List<Category> list = categoryRepository.findParentCategoryListByOrderNumGoeAndLt(newOrderNum, originalOrderNum)
                        .orElse(new ArrayList<>());
                list.forEach(Category::increaseOrderNum);
            }else {
                List<Category> list = categoryRepository.findParentCategoryListByOrderNumGtAndLoe(originalOrderNum, newOrderNum)
                        .orElse(new ArrayList<>());
                list.forEach(Category :: decreaseOrderNum);
            }

            findCategory.changeOrderNum(dto.getOrderNum());
        }

        findCategory.changeName(dto.getName());
    }

    /**
     * 대분류 삭제
     *
     * @param id
     */
    @Transactional
    public void deleteParentCategory(Integer id) {

        Category findCategory = categoryRepository.findCategoryById(id)
                .orElseThrow(() -> new CustomException(ExceptionCode.PARENT_CATEGORY_NOT_FOUND));

        if(findCategory.getParentId() != null) {
            throw new CustomException(ExceptionCode.BAD_REQUEST);
        }

        // 소분류 항목들 전부 삭제처리
        categoryRepository.findByDataStatusNotParentId(findCategory.getId())
                .ifPresent(childList -> {
                    childList.forEach(Category::delete);
                });

        // 순번 재정렬 처리
        categoryRepository.findParentCategoryListByDataStatusNotAndOrderNumGt(findCategory.getOrderNum())
                .ifPresent(categoryList -> {
                    categoryList.forEach(Category::decreaseOrderNum);
                });

        // 삭제처리
        findCategory.delete();

    }

    /**
     * 소분류 등록
     *
     * @param dto
     */
    @Transactional
    public void saveCategory(CategoryDto.CategoryRegDto dto) {

        Category findCategory = categoryRepository.findByNameAndParentId(dto.getName(), dto.getParentId()).orElse(null);

        if(findCategory != null) {
            throw new CustomException(ExceptionCode.CATEGORY_ALREADY_EXIST);
        }

        OrderType orderType = OrderType.findOrderType(dto.getOrderType());
        Integer orderNum = dto.getOrderNum();

        if(OrderType.Manual.equals(orderType)) {
            // 순번 정리
            List<Category> list = categoryRepository.findByNameAndParentIdOrderNumGoe(dto.getName(), dto.getParentId(), dto.getOrderNum())
                    .orElse(new ArrayList<>());

            list.forEach(Category::increaseOrderNum);
        }else if(OrderType.Auto.equals(orderType)) {
            Long totalCount = categoryRepository.findByParentIdCount(dto.getParentId());
            orderNum = (totalCount.intValue() + 1);
        }

        Category category = Category.builder()
                .name(dto.getName())
                .parentId(dto.getParentId())
                .orderNum(orderNum)
                .dataStatus(DataStatus.Yes)
                .build();

        categoryRepository.save(category);
    }

    /**
     * 소분류 조회
     *
     * @param parentId
     * @return
     */
    public List<CategoryDto.CategoryResDto> findCategoryList(Integer parentId) {

        List<Category> list = categoryRepository.findCategoryListByParentId(parentId).orElse(new ArrayList<>());

        return list.stream().map(category -> {
            return CategoryDto.CategoryResDto.builder()
                    .id(category.getId())
                    .name(category.getName())
                    .parentId(category.getParentId())
                    .orderNum(category.getOrderNum())
                    .build();
        }).toList();
    }

    /**
     * 소분류 수정
     *
     * @param dto
     */
    @Transactional
    public void updateCategory(CategoryDto.CategoryUpdDto dto) {

        Category findCategory = categoryRepository.findById(dto.getId())
                .orElseThrow(() -> new CustomException(ExceptionCode.CATEGORY_NOT_FOUND));

        Integer originalOrderNum = findCategory.getOrderNum();
        Integer newOrderNum = dto.getOrderNum();

        if(!Objects.equals(originalOrderNum, newOrderNum)) {
            if(originalOrderNum > newOrderNum) {
                List<Category> list = categoryRepository.findCategoryListByParentIdAndOrderNumGoeAndLt(dto.getParentId(), newOrderNum, originalOrderNum)
                        .orElse(new ArrayList<>());
                list.forEach(Category :: increaseOrderNum);
            }else {
                List<Category> list = categoryRepository.findCategoryListByParentIdAndOrderNumGtAndLoe(dto.getParentId(), originalOrderNum, newOrderNum)
                        .orElse(new ArrayList<>());
                list.forEach(Category :: decreaseOrderNum);
            }

            findCategory.changeOrderNum(dto.getOrderNum());
        }

        findCategory.changeName(dto.getName());
    }

    /**
     * 소분류 삭제
     *
     * @param id
     */
    @Transactional
    public void deleteCategory(Integer id) {

        Category findCategory = categoryRepository.findCategoryById(id)
                .orElseThrow(() -> new CustomException(ExceptionCode.CATEGORY_NOT_FOUND));

        // 순번 재정렬 처리
        categoryRepository.findCategoryListByParentIdAndDataStatusNotAndOrderNumGt(findCategory.getParentId(), findCategory.getOrderNum())
                .ifPresent(categoryList -> {
                   categoryList.forEach(Category :: decreaseOrderNum);
                });

        findCategory.delete();
    }
}
