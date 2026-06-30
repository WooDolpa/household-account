package household.account.web.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;

public class ReceiptDto {

    @Getter
    @NoArgsConstructor
    public static class RegDto {
        private String name;
        private String receiptType;
        private String paymentType;
        private String installment;
        private Integer categoryId;
        private Integer amount;
        private String usedDate;
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
    }
}
