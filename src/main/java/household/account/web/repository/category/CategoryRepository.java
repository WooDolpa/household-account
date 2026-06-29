package household.account.web.repository.category;

import household.account.web.domain.category.Category;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CategoryRepository extends JpaRepository<Category, Integer>, CategoryCustomRepository {
}
