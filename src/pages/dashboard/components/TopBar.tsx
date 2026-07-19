import logo from "../../../assets/logo.png";
import { useI18n } from "../../../core/i18n/I18nContext";
import { LangSwitcher } from "../../../core/layout/LangSwitcher";
import { IconMenu } from "./icons";
import "./TopBar.css";

interface TopBarProps {
  onOpenMobileMenu: () => void;
}

export function TopBar({ onOpenMobileMenu }: TopBarProps) {
  const { t } = useI18n();
  return (
    <div className="dash-top">
      <div className="dash-top-left">
        <button className="mobtn" type="button" onClick={onOpenMobileMenu}>
          <IconMenu />
        </button>
        <div className="dash-brand">
          <div className="dash-logo">
            <img src={logo} alt="SAHAB" />
          </div>
          SAHAB ERP
        </div>
      </div>
      <div className="dash-user">
        <span>{t("welcome")}</span>
        <LangSwitcher />
        <div className="dash-avatar" />
      </div>
    </div>
  );
}
