package household.account.web.repository.receipt;

import household.account.web.domain.receipt.Receipt;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ReceiptCustomRepository {

    Page<Receipt> findReceiptList(String startDate, String endDate, Integer parentCategoryId, Integer categoryId, String name, Pageable pageable);

}
