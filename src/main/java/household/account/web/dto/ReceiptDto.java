package household.account.web.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

public class ReceiptDto {

    @Getter
    @NoArgsConstructor
    public static class RegDto {
        private String name;
        private String receiptType;
        private String paymentType;
        private String installment;
        private Integer parentCategoryId;
        private Integer categoryId;
        private Integer amount;
        private String usedDate;
    }

    @Getter
    @NoArgsConstructor
    public static class BulkRegDto {
        private List<RegDto> receipts;
    }

    @Getter
    @NoArgsConstructor
    public static class ListDto {

        private List<ResDto> data;
        private Integer totalPages;
        private Integer totalElements;
        private Integer currentPage;
        private Integer pageSize;

        @Builder
        public ListDto(List<ResDto> data, Integer totalPages, Integer totalElements, Integer currentPage, Integer pageSize) {
            this.data = data;
            this.totalPages = totalPages;
            this.totalElements = totalElements;
            this.currentPage = currentPage;
            this.pageSize = pageSize;
        }
    }

    @Getter
    @NoArgsConstructor
    public static class ResDto {
        private Integer id;
        private String name;
        private String receiptType;
        private String paymentType;
        private String installment;
        private Integer parentCategoryId;
        private Integer categoryId;
        private Integer amount;
        private String usedDate;

        @Builder
        public ResDto(Integer id, String name, String receiptType, String paymentType, String installment, Integer parentCategoryId, Integer categoryId, Integer amount, String usedDate) {
            this.id = id;
            this.name = name;
            this.receiptType = receiptType;
            this.paymentType = paymentType;
            this.installment = installment;
            this.parentCategoryId = parentCategoryId;
            this.categoryId = categoryId;
            this.amount = amount;
            this.usedDate = usedDate;
        }
    }
}
