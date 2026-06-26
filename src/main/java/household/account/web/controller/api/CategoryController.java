package household.account.web.controller.api;

import household.account.web.dto.ApiResponseDto;
import household.account.web.dto.CategoryDto;
import household.account.web.service.CategoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
     * 대분류 조회
     *
     * @return
     */
    @GetMapping(path = "/parent/list")
    public ResponseEntity<String> findParentCategoryList() {
        List<CategoryDto.ParentCategoryResDto> list = categoryService.findParentCategoryList();
        return new ResponseEntity<>(ApiResponseDto.makeResponse(list), HttpStatus.OK);
    }

    /**
     * 대분류 수정
     *
     * @param dto
     * @return
     */
    @PutMapping(path = "/parent")
    public ResponseEntity<String> updateParentCategory(@RequestBody CategoryDto.ParentCategoryUpdDto dto) {
        categoryService.updateParentCategory(dto);
        return new ResponseEntity<>(ApiResponseDto.makeSuccessResponse(), HttpStatus.OK);
    }

    /**
     * 대분류 삭제
     *
     * @param id
     * @return
     */
    @DeleteMapping(path = "/parent/{id}")
    public ResponseEntity<String> deleteParentCategory(@PathVariable Integer id) {
        categoryService.deleteParentCategory(id);
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

    /**
     * 소분류 조회
     *
     * @param parentId
     * @return
     */
    @GetMapping(path = "/list")
    public ResponseEntity<String> findCategoryList(@RequestParam(name = "parentId") Integer parentId) {
        List<CategoryDto.CategoryResDto> list = categoryService.findCategoryList(parentId);
        return new ResponseEntity<>(ApiResponseDto.makeResponse(list), HttpStatus.OK);
    }

    /**
     * 소분류 수정
     *
     * @param dto
     * @return
     */
    @PutMapping
    public ResponseEntity<String> updateCategory(@RequestBody CategoryDto.CategoryUpdDto dto) {
        categoryService.updateCategory(dto);
        return new ResponseEntity<>(ApiResponseDto.makeSuccessResponse(), HttpStatus.OK);
    }

    /**
     * 소분류 삭제
     *
     * @param id
     * @return
     */
    @DeleteMapping(path = "/{id}")
    public ResponseEntity<String> deleteCategory(@PathVariable Integer id) {
        categoryService.deleteCategory(id);
        return new ResponseEntity<>(ApiResponseDto.makeSuccessResponse(), HttpStatus.OK);
    }
}
