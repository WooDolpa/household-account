package household.account.web.enums;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.Arrays;

@Getter
@RequiredArgsConstructor
public enum DataStatus {

    Yes("Y", "사용"),
    No("N", "미사용"),
    ;

    private final String key;
    private final String desc;

    public static DataStatus findDataStatus(String key) {
        return Arrays.stream(DataStatus.values())
                .filter(i -> i.key.equals(key))
                .findAny()
                .orElse(DataStatus.Yes);
    }
}
