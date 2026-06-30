package household.account.web.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.Arrays;

@Getter
@RequiredArgsConstructor
public enum OrderType {

    AUTO("auto", "자동부여"),
    MANUAL("manual", "직접입력")
    ;

    private final String key;
    private final String desc;

    public static OrderType findOrderType(String key) {

        return Arrays.stream(OrderType.values())
                .filter(orderType -> orderType.key.equals(key))
                .findAny()
                .orElse(null);
    }
}
