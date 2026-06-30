package household.account.web.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.Arrays;

@Getter
@RequiredArgsConstructor
public enum PaymentType {

    CARD("C", "카드"),
    CASH("M", "현금")
    ;

    private final String key;
    private final String description;

    public static PaymentType findPaymentType(String key) {
        return Arrays.stream(PaymentType.values())
                .filter(i -> i.key.equals(key))
                .findAny()
                .orElse(CARD);
    }
}
