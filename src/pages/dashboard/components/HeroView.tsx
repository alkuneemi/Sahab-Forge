import { useNavigate } from "react-router-dom";
import logo from "../../../assets/logo.png";
import { useI18n } from "../../../core/i18n/I18nContext";
import type { GalleryItem } from "../dashboard.data";
import "./HeroView.css";

interface HeroViewProps {
  gallery: GalleryItem[];
}

export function HeroView({ gallery }: HeroViewProps) {
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <div className="hero-view">
      <div className="hero-logo">
        <img src={logo} alt="SAHAB" />
      </div>
      <div className="hero-name">SAHAB</div>
      <div className="hero-about">{t("about")}</div>
      <button
        type="button"
        className="hero-btn"
        onClick={() => navigate("/system-control")}
      >
        {t("launch")}
      </button>

      {gallery.length > 0 && (
        <>
          <div className="hero-gallery-h">{t("gallery_h")}</div>
          <div className="hero-gallery">
            {gallery.map((item, idx) => (
              <div className="gcard" key={idx}>
                <img src={item.imageUrl} alt="" />
                <div className="gc-b">
                  <div className="gc-t">{item.title}</div>
                  <div className="gc-d">{item.description}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
