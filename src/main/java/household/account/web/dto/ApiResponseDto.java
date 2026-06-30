package household.account.web.dto;

import household.account.web.constants.ApiConstants;
import household.account.web.exception.CustomException;
import lombok.extern.slf4j.Slf4j;
import tools.jackson.databind.ObjectMapper;

import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
public class ApiResponseDto {

    public static String makeSuccessResponse() {
        return makeResponseData(ApiConstants.RESPONSE_SUCCESS_CODE, ApiConstants.RESPONSE_SUCCESS_MESSAGE, null);
    }

    public static String makeFailureResponse() {
        return makeResponseData(ApiConstants.RESPONSE_FAILURE_CODE, ApiConstants.RESPONSE_FAILURE_MESSAGE, null);
    }

    public static String makeResponse(Object data) {
        return makeResponseData(ApiConstants.RESPONSE_SUCCESS_CODE, ApiConstants.RESPONSE_SUCCESS_MESSAGE, data);
    }

    public static String makeResponse(Object data, Integer totalPages, Integer totalElements, Integer currentPage, Integer pageSize) {
        return makeResponseListData(ApiConstants.RESPONSE_SUCCESS_CODE, ApiConstants.RESPONSE_SUCCESS_MESSAGE, data, totalPages, totalElements, currentPage, pageSize);
    }

    public static String makeResponse(CustomException e) {
        return makeResponseData(e.getCode(), e.getMessage(), null);
    }

    private static String makeResponseData(String code, String message, Object data) {

        ObjectMapper objectMapper = new ObjectMapper();
        Map<String, Object> responseMap = new LinkedHashMap<>();
        String result = "";

        responseMap.put("code", code);
        responseMap.put("message", message);
        if(data != null) {
            responseMap.put("data", data);
        }

        try {
            result = objectMapper.writeValueAsString(responseMap);
        }catch (Exception e) {
            log.error("[ApiResponseDto][makeResponseData] objectMapper parsing error : {}", e.getMessage());
        }

        return result;
    }

    private static String makeResponseListData(String code, String message, Object data, Integer totalPages, Integer totalElements, Integer currentPage, Integer pageSize) {

        ObjectMapper objectMapper = new ObjectMapper();
        Map<String, Object> responseMap = new LinkedHashMap<>();
        String result = "";

        responseMap.put("code", code);
        responseMap.put("message", message);
        if(data != null) {
            responseMap.put("data", data);
        }
        if(totalPages != null) {
            responseMap.put("totalPages", totalPages);
        }
        if(totalElements != null) {
            responseMap.put("totalElements", totalElements);
        }
        if(currentPage != null) {
            responseMap.put("currentPage", currentPage);
        }
        if(pageSize != null) {
            responseMap.put("pageSize", pageSize);
        }

        try {
            result = objectMapper.writeValueAsString(responseMap);
        }catch (Exception e) {
            log.error("[ApiResponseDto][makeResponseListData] objectMapper parsing error : {}", e.getMessage());
        }

        return result;
    }
}
