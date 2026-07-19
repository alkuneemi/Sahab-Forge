(()=>{registerSahabModule("apps-sidebar-injector",()=>{let d="sahab-apps-left-sidebar",p="sahab-apps-left-sidebar__title",b="sahab-apps-left-sidebar__list",o="sahab-apps-left-sidebar__item",u="sahab-apps-left-sidebar__item--active",t=null,s=null,m=[];function f(a){return String(a||"").replace(/▾/g,"").replace(/\s+/g," ").trim()}function x(){let a=document.querySelector(".menubar");if(!a)return[];let n=new Set;return Array.from(a.querySelectorAll(".mb-btn, .mb-link")).map(e=>f(e.textContent)).filter(e=>e&&!n.has(e)&&n.add(e))}function c(){t?.remove(),t=null}function v(a){if(!t)return;Array.from(t.querySelectorAll(`.${o}`)).forEach(r=>{r.classList.toggle(u.replace("sahab-apps-left-sidebar__item--active","sahab-apps-left-sidebar__item--active"),r.dataset.label===a)})}function h(a){if(!a.length){c();return}if(!t){t=document.createElement("aside"),t.className=d,t.setAttribute("aria-label","Apps menu sidebar");let e=document.querySelector(".aw-body");e?e.insertBefore(t,e.firstChild):document.body.appendChild(t)}let n=document.createElement("div");n.className=p,n.textContent="App menu";let r=document.createElement("div");r.className=b,a.forEach(e=>{let i=document.createElement("button");i.type="button",i.className=o,i.dataset.label=e,i.textContent=e,i.addEventListener("click",()=>{let g=Array.from(document.querySelectorAll(".menubar .mb-btn, .menubar .mb-link")).find(S=>f(S.textContent)===e);g&&(g.click(),v(e))}),r.appendChild(i)}),t.innerHTML="",t.appendChild(n),t.appendChild(r),m=a}function l(){let a=window.location.pathname||"";if(!/^\/apps\//.test(a)){c();return}let r=x();if(!r.length){c();return}r.join(`
`)!==m.join(`
`)?h(r):t||h(r)}function w(){s||(s=new MutationObserver(()=>{window.requestAnimationFrame(l)}),s.observe(document.body,{childList:!0,subtree:!0}))}function y(){s?.disconnect(),s=null}return w(),window.addEventListener("popstate",l),window.addEventListener("load",l),window.setTimeout(l,150),window.setInterval(l,1800),{id:"apps-sidebar-injector",name:{ar:"\u0645\u064F\u062D\u0642\u0651\u0642 \u0627\u0644\u0634\u0631\u064A\u0637 \u0627\u0644\u062C\u0627\u0646\u0628\u064A",en:"App Sidebar Injector"},description:{ar:"\u064A\u0636\u064A\u0641 \u0634\u0631\u064A\u0637\u0627\u064B \u062C\u0627\u0646\u0628\u064A\u0627\u064B \u0639\u0644\u0649 \u0635\u0641\u062D\u0627\u062A /apps/:tech \u0628\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0623\u0633\u0645\u0627\u0621 \u0627\u0644\u0642\u0648\u0627\u0626\u0645 \u0627\u0644\u0638\u0627\u0647\u0631\u0629 \u0628\u0627\u0644\u0641\u0639\u0644.",en:"Adds a left sidebar on /apps/:tech pages using the visible app menu labels."},version:"1.0.0",styleOverrides:`
      .${d} {
        position: sticky;
        top: 16px;
        align-self: flex-start;
        width: 220px;
        max-height: calc(100vh - 32px);
        overflow: auto;
        padding: 12px;
        margin-right: 16px;
        border: 1px solid rgba(15, 23, 42, 0.08);
        border-radius: 16px;
        background: rgba(255, 255, 255, 0.94);
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
        backdrop-filter: blur(8px);
      }
      .${p} {
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--color-text-muted, #64748b);
        margin-bottom: 10px;
      }
      .${b} {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .${o} {
        border: 0;
        border-radius: 10px;
        padding: 8px 10px;
        text-align: left;
        background: transparent;
        color: var(--color-text, #0f172a);
        cursor: pointer;
        font-size: 13px;
        line-height: 1.4;
      }
      .${o}:hover {
        background: rgba(59, 130, 246, 0.1);
      }
      .${o}.${u} {
        background: rgba(59, 130, 246, 0.16);
        color: var(--color-primary, #2563eb);
        font-weight: 700;
      }
      .dashboard-frame .aw-body {
        display: flex;
        align-items: flex-start;
        gap: 16px;
      }
      .dashboard-frame .aw-area {
        flex: 1 1 auto;
        min-width: 0;
      }
      @media (max-width: 980px) {
        .${d} {
          display: none;
        }
        .dashboard-frame .aw-body {
          display: block;
        }
      }
      body[dir="rtl"] .${d} {
        margin-left: 16px;
        margin-right: 0;
      }
    `}});})();
