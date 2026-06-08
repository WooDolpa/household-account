package household.account.web.controller.view;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping(path = "/settings")
public class SettingsController {

    @GetMapping(path = "/category")
    public String category() {
        return "settings/category";
    }

}
