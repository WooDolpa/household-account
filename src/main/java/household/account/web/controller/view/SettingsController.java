package household.account.web.controller.view;

import household.account.web.service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping(path = "/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final CategoryService categoryService;

    @GetMapping(path = "/category")
    public String category() {
        return "settings/category";
    }

    @GetMapping(path = "/receipt")
    public String receipt(Model model) {

        model.addAttribute("parentCategoryList", categoryService.findParentCategoryList());

        return "settings/receipt";
    }
}
