package household.account.web.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

public class CategoryDto {

    @Getter
    @NoArgsConstructor
    public static class ParentCategoryRegDto {
        private String name;
        private String orderType;
        private Integer orderNum;
    }

    @Getter
    @NoArgsConstructor
    public static class ParentCategoryResDto {

        private Integer id;
        private String name;
        private Integer parentId;
        private Integer orderNum;

        @Builder
        public ParentCategoryResDto(Integer id, String name, Integer parentId, Integer orderNum) {
            this.id = id;
            this.name = name;
            this.parentId = parentId;
            this.orderNum = orderNum;
        }
    }

    @Getter
    @NoArgsConstructor
    public static class CategoryRegDto {
        private Integer parentId;
        private String name;
        private String orderType;
        private Integer orderNum;
    }

    @Getter
    @NoArgsConstructor
    public static class CategoryResDto {
        private Integer id;
        private String name;
        private Integer parentId;
        private Integer orderNum;

        @Builder
        public CategoryResDto(Integer id, String name, Integer parentId, Integer orderNum) {
            this.id = id;
            this.name = name;
            this.parentId = parentId;
            this.orderNum = orderNum;
        }
    }
}
