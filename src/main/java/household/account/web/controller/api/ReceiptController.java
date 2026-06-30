package household.account.web.controller.api;

import household.account.web.dto.ApiResponseDto;
import household.account.web.dto.ReceiptDto;
import household.account.web.service.ReceiptService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping(path = "/receipt")
@RequiredArgsConstructor
public class ReceiptController {

    private final ReceiptService receiptService;

    /**
     * 사용내역 등록
     *
     * @param dto
     * @return
     */
    @PostMapping
    public ResponseEntity<String> saveReceipt(@RequestBody ReceiptDto.RegDto dto) {
        receiptService.saveReceipt(dto);
        return new ResponseEntity<>(ApiResponseDto.makeSuccessResponse(), HttpStatus.OK);
    }
}
