package household.account.web.dto;

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
    public static class CategoryRegDto {
        private Integer parentId;
        private String name;
        private String orderType;
        private Integer orderNum;
    }
}
