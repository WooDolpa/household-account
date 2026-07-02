package household.account.web.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.Arrays;

@Getter
@RequiredArgsConstructor
public enum Installment {

    PAYMENT_ONE_TIME("001", "일시불"),
    PAYMENT_2_MONTH("002", "2개월 할부"),
    PAYMENT_3_MONTH("003", "3개월 할부"),
    PAYMENT_4_MONTH("004", "4개월 할부"),
    PAYMENT_5_MONTH("005", "5개월 할부"),
    PAYMENT_6_MONTH("006", "6개월 할부"),
    PAYMENT_7_MONTH("007", "7개월 할부"),
    PAYMENT_8_MONTH("008", "8개월 할부"),
    PAYMENT_9_MONTH("009", "9개월 할부"),
    PAYMENT_10_MONTH("010", "10개월 할부"),
    PAYMENT_11_MONTH("011", "11개월 할부"),
    PAYMENT_12_MONTH("012", "12개월 할부"),
    ;

    private final String key;
    private final String description;

    public static Installment findByInstallment(String key) {
        return Arrays.stream(Installment.values())
                .filter(i -> i.key.equals(key))
                .findAny()
                .orElse(PAYMENT_ONE_TIME);
    }
}
