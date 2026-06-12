package household.account.web.service;

import household.account.web.domain.category.Category;
import household.account.web.dto.CategoryDto;
import household.account.web.enums.DataStatus;
import household.account.web.enums.OrderType;
import household.account.web.exception.CustomException;
import household.account.web.exception.ExceptionCode;
import household.account.web.repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

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
            orderNum = totalCount.intValue();
        }

        Category category = Category.builder()
                .name(dto.getName())
                .dataStatus(DataStatus.Yes)
                .orderNum(orderNum)
                .build();

        categoryRepository.save(category);
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
            orderNum = totalCount.intValue();
        }

        Category category = Category.builder()
                .name(dto.getName())
                .parentId(dto.getParentId())
                .orderNum(orderNum)
                .dataStatus(DataStatus.Yes)
                .build();

        categoryRepository.save(category);
    }
}
