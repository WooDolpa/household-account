package household.account.web.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.Arrays;

@Getter
@RequiredArgsConstructor
public enum ReceiptType {

    Fix("F", "고정"),
    Once("O", "일회성")
    ;

    private final String key;
    private final String description;

    public static ReceiptType findReceiptType(String key) {
        return Arrays.stream(ReceiptType.values())
                .filter(r -> r.key.equals(key))
                .findAny()
                .orElse(null);
    }
}
