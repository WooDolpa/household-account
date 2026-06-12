package household.account.web.controller.api;

import household.account.web.dto.ApiResponseDto;
import household.account.web.dto.CategoryDto;
import household.account.web.service.CategoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping(path = "/category")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    /**
     * 대분류 등록
     *
     * @param dto
     * @return
     */
    @PostMapping(path = "/parent")
    public ResponseEntity<String> saveParentCategory(@RequestBody CategoryDto.ParentCategoryRegDto dto) {
        categoryService.saveParentCategory(dto);
        return new ResponseEntity<>(ApiResponseDto.makeSuccessResponse(), HttpStatus.OK);
    }

    /**
     * 소분류 등록
     *
     * @param dto
     * @return
     */
    @PostMapping
    public ResponseEntity<String> saveCategory(@RequestBody CategoryDto.CategoryRegDto dto) {
        categoryService.saveCategory(dto);
        return new ResponseEntity<>(ApiResponseDto.makeSuccessResponse(), HttpStatus.OK);
    }
}
