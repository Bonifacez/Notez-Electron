"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args) {
    const [channel, listener] = args;
    return electron.ipcRenderer.on(
      channel,
      (event, ...args2) => listener(event, ...args2)
    );
  },
  off(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.off(channel, ...omit);
  },
  send(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.send(channel, ...omit);
  },
  invoke(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.invoke(channel, ...omit);
  }
  // You can expose other APTs you need here.
  // ...
});
function domReady(condition = ["complete", "interactive"]) {
  return new Promise((resolve) => {
    if (condition.includes(document.readyState)) {
      resolve(true);
    } else {
      document.addEventListener("readystatechange", () => {
        if (condition.includes(document.readyState)) {
          resolve(true);
        }
      });
    }
  });
}
const safeDOM = {
  append(parent, child) {
    if (!Array.from(parent.children).find((e) => e === child)) {
      return parent.appendChild(child);
    }
  },
  remove(parent, child) {
    if (Array.from(parent.children).find((e) => e === child)) {
      return parent.removeChild(child);
    }
  }
};
function useLoading() {
  const className = `loaders-css__square-spin`;
  const styleContent = `
@keyframes square-spin {
  25% { transform: perspective(100px) rotateX(180deg) rotateY(0); }
  50% { transform: perspective(100px) rotateX(180deg) rotateY(180deg); }
  75% { transform: perspective(100px) rotateX(0) rotateY(180deg); }
  100% { transform: perspective(100px) rotateX(0) rotateY(0); }
}
.${className} > div {
  animation-fill-mode: both;
  width: 50px;
  height: 50px;
  background: #fff;
  animation: square-spin 3s 0s cubic-bezier(0.09, 0.57, 0.49, 0.9) infinite;
}
.app-loading-wrap {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #282c34;
  z-index: 9;
}
    `;
  const oStyle = document.createElement("style");
  const oDiv = document.createElement("div");
  oStyle.id = "app-loading-style";
  oStyle.innerHTML = styleContent;
  oDiv.className = "app-loading-wrap";
  oDiv.innerHTML = `<div class="${className}"><div></div></div>`;
  return {
    appendLoading() {
      safeDOM.append(document.head, oStyle);
      safeDOM.append(document.body, oDiv);
    },
    removeLoading() {
      safeDOM.remove(document.head, oStyle);
      safeDOM.remove(document.body, oDiv);
    }
  };
}
const { appendLoading, removeLoading } = useLoading();
domReady().then(appendLoading);
window.onmessage = (ev) => {
  ev.data.payload === "removeLoading" && removeLoading();
};
setTimeout(removeLoading, 4999);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXgubWpzIiwic291cmNlcyI6WyIuLi8uLi9lbGVjdHJvbi9wcmVsb2FkL2luZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGlwY1JlbmRlcmVyLCBjb250ZXh0QnJpZGdlIH0gZnJvbSBcImVsZWN0cm9uXCI7XG5cbi8vIC0tLS0tLS0tLSBFeHBvc2Ugc29tZSBBUEkgdG8gdGhlIFJlbmRlcmVyIHByb2Nlc3MgLS0tLS0tLS0tXG5jb250ZXh0QnJpZGdlLmV4cG9zZUluTWFpbldvcmxkKFwiaXBjUmVuZGVyZXJcIiwge1xuICAgIG9uKC4uLmFyZ3M6IFBhcmFtZXRlcnM8dHlwZW9mIGlwY1JlbmRlcmVyLm9uPikge1xuICAgICAgICBjb25zdCBbY2hhbm5lbCwgbGlzdGVuZXJdID0gYXJncztcbiAgICAgICAgcmV0dXJuIGlwY1JlbmRlcmVyLm9uKGNoYW5uZWwsIChldmVudCwgLi4uYXJncykgPT5cbiAgICAgICAgICAgIGxpc3RlbmVyKGV2ZW50LCAuLi5hcmdzKVxuICAgICAgICApO1xuICAgIH0sXG4gICAgb2ZmKC4uLmFyZ3M6IFBhcmFtZXRlcnM8dHlwZW9mIGlwY1JlbmRlcmVyLm9mZj4pIHtcbiAgICAgICAgY29uc3QgW2NoYW5uZWwsIC4uLm9taXRdID0gYXJncztcbiAgICAgICAgcmV0dXJuIGlwY1JlbmRlcmVyLm9mZihjaGFubmVsLCAuLi5vbWl0KTtcbiAgICB9LFxuICAgIHNlbmQoLi4uYXJnczogUGFyYW1ldGVyczx0eXBlb2YgaXBjUmVuZGVyZXIuc2VuZD4pIHtcbiAgICAgICAgY29uc3QgW2NoYW5uZWwsIC4uLm9taXRdID0gYXJncztcbiAgICAgICAgcmV0dXJuIGlwY1JlbmRlcmVyLnNlbmQoY2hhbm5lbCwgLi4ub21pdCk7XG4gICAgfSxcbiAgICBpbnZva2UoLi4uYXJnczogUGFyYW1ldGVyczx0eXBlb2YgaXBjUmVuZGVyZXIuaW52b2tlPikge1xuICAgICAgICBjb25zdCBbY2hhbm5lbCwgLi4ub21pdF0gPSBhcmdzO1xuICAgICAgICByZXR1cm4gaXBjUmVuZGVyZXIuaW52b2tlKGNoYW5uZWwsIC4uLm9taXQpO1xuICAgIH0sXG5cbiAgICAvLyBZb3UgY2FuIGV4cG9zZSBvdGhlciBBUFRzIHlvdSBuZWVkIGhlcmUuXG4gICAgLy8gLi4uXG59KTtcblxuLy8gLS0tLS0tLS0tIFByZWxvYWQgc2NyaXB0cyBsb2FkaW5nIC0tLS0tLS0tLVxuZnVuY3Rpb24gZG9tUmVhZHkoXG4gICAgY29uZGl0aW9uOiBEb2N1bWVudFJlYWR5U3RhdGVbXSA9IFtcImNvbXBsZXRlXCIsIFwiaW50ZXJhY3RpdmVcIl1cbikge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICBpZiAoY29uZGl0aW9uLmluY2x1ZGVzKGRvY3VtZW50LnJlYWR5U3RhdGUpKSB7XG4gICAgICAgICAgICByZXNvbHZlKHRydWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcInJlYWR5c3RhdGVjaGFuZ2VcIiwgKCkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChjb25kaXRpb24uaW5jbHVkZXMoZG9jdW1lbnQucmVhZHlTdGF0ZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh0cnVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0pO1xufVxuXG5jb25zdCBzYWZlRE9NID0ge1xuICAgIGFwcGVuZChwYXJlbnQ6IEhUTUxFbGVtZW50LCBjaGlsZDogSFRNTEVsZW1lbnQpIHtcbiAgICAgICAgaWYgKCFBcnJheS5mcm9tKHBhcmVudC5jaGlsZHJlbikuZmluZCgoZSkgPT4gZSA9PT0gY2hpbGQpKSB7XG4gICAgICAgICAgICByZXR1cm4gcGFyZW50LmFwcGVuZENoaWxkKGNoaWxkKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgcmVtb3ZlKHBhcmVudDogSFRNTEVsZW1lbnQsIGNoaWxkOiBIVE1MRWxlbWVudCkge1xuICAgICAgICBpZiAoQXJyYXkuZnJvbShwYXJlbnQuY2hpbGRyZW4pLmZpbmQoKGUpID0+IGUgPT09IGNoaWxkKSkge1xuICAgICAgICAgICAgcmV0dXJuIHBhcmVudC5yZW1vdmVDaGlsZChjaGlsZCk7XG4gICAgICAgIH1cbiAgICB9LFxufTtcblxuLyoqXG4gKiBodHRwczovL3RvYmlhc2FobGluLmNvbS9zcGlua2l0XG4gKiBodHRwczovL2Nvbm5vcmF0aGVydG9uLmNvbS9sb2FkZXJzXG4gKiBodHRwczovL3Byb2plY3RzLmx1a2VoYWFzLm1lL2Nzcy1sb2FkZXJzXG4gKiBodHRwczovL21hdGVqa3VzdGVjLmdpdGh1Yi5pby9TcGluVGhhdFNoaXRcbiAqL1xuZnVuY3Rpb24gdXNlTG9hZGluZygpIHtcbiAgICBjb25zdCBjbGFzc05hbWUgPSBgbG9hZGVycy1jc3NfX3NxdWFyZS1zcGluYDtcbiAgICBjb25zdCBzdHlsZUNvbnRlbnQgPSBgXG5Aa2V5ZnJhbWVzIHNxdWFyZS1zcGluIHtcbiAgMjUlIHsgdHJhbnNmb3JtOiBwZXJzcGVjdGl2ZSgxMDBweCkgcm90YXRlWCgxODBkZWcpIHJvdGF0ZVkoMCk7IH1cbiAgNTAlIHsgdHJhbnNmb3JtOiBwZXJzcGVjdGl2ZSgxMDBweCkgcm90YXRlWCgxODBkZWcpIHJvdGF0ZVkoMTgwZGVnKTsgfVxuICA3NSUgeyB0cmFuc2Zvcm06IHBlcnNwZWN0aXZlKDEwMHB4KSByb3RhdGVYKDApIHJvdGF0ZVkoMTgwZGVnKTsgfVxuICAxMDAlIHsgdHJhbnNmb3JtOiBwZXJzcGVjdGl2ZSgxMDBweCkgcm90YXRlWCgwKSByb3RhdGVZKDApOyB9XG59XG4uJHtjbGFzc05hbWV9ID4gZGl2IHtcbiAgYW5pbWF0aW9uLWZpbGwtbW9kZTogYm90aDtcbiAgd2lkdGg6IDUwcHg7XG4gIGhlaWdodDogNTBweDtcbiAgYmFja2dyb3VuZDogI2ZmZjtcbiAgYW5pbWF0aW9uOiBzcXVhcmUtc3BpbiAzcyAwcyBjdWJpYy1iZXppZXIoMC4wOSwgMC41NywgMC40OSwgMC45KSBpbmZpbml0ZTtcbn1cbi5hcHAtbG9hZGluZy13cmFwIHtcbiAgcG9zaXRpb246IGZpeGVkO1xuICB0b3A6IDA7XG4gIGxlZnQ6IDA7XG4gIHdpZHRoOiAxMDB2dztcbiAgaGVpZ2h0OiAxMDB2aDtcbiAgZGlzcGxheTogZmxleDtcbiAgYWxpZ24taXRlbXM6IGNlbnRlcjtcbiAganVzdGlmeS1jb250ZW50OiBjZW50ZXI7XG4gIGJhY2tncm91bmQ6ICMyODJjMzQ7XG4gIHotaW5kZXg6IDk7XG59XG4gICAgYDtcbiAgICBjb25zdCBvU3R5bGUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3R5bGVcIik7XG4gICAgY29uc3Qgb0RpdiA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIik7XG5cbiAgICBvU3R5bGUuaWQgPSBcImFwcC1sb2FkaW5nLXN0eWxlXCI7XG4gICAgb1N0eWxlLmlubmVySFRNTCA9IHN0eWxlQ29udGVudDtcbiAgICBvRGl2LmNsYXNzTmFtZSA9IFwiYXBwLWxvYWRpbmctd3JhcFwiO1xuICAgIG9EaXYuaW5uZXJIVE1MID0gYDxkaXYgY2xhc3M9XCIke2NsYXNzTmFtZX1cIj48ZGl2PjwvZGl2PjwvZGl2PmA7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBhcHBlbmRMb2FkaW5nKCkge1xuICAgICAgICAgICAgc2FmZURPTS5hcHBlbmQoZG9jdW1lbnQuaGVhZCwgb1N0eWxlKTtcbiAgICAgICAgICAgIHNhZmVET00uYXBwZW5kKGRvY3VtZW50LmJvZHksIG9EaXYpO1xuICAgICAgICB9LFxuICAgICAgICByZW1vdmVMb2FkaW5nKCkge1xuICAgICAgICAgICAgc2FmZURPTS5yZW1vdmUoZG9jdW1lbnQuaGVhZCwgb1N0eWxlKTtcbiAgICAgICAgICAgIHNhZmVET00ucmVtb3ZlKGRvY3VtZW50LmJvZHksIG9EaXYpO1xuICAgICAgICB9LFxuICAgIH07XG59XG5cbi8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuY29uc3QgeyBhcHBlbmRMb2FkaW5nLCByZW1vdmVMb2FkaW5nIH0gPSB1c2VMb2FkaW5nKCk7XG5kb21SZWFkeSgpLnRoZW4oYXBwZW5kTG9hZGluZyk7XG5cbndpbmRvdy5vbm1lc3NhZ2UgPSAoZXYpID0+IHtcbiAgICBldi5kYXRhLnBheWxvYWQgPT09IFwicmVtb3ZlTG9hZGluZ1wiICYmIHJlbW92ZUxvYWRpbmcoKTtcbn07XG5cbnNldFRpbWVvdXQocmVtb3ZlTG9hZGluZywgNDk5OSk7XG4iXSwibmFtZXMiOlsiY29udGV4dEJyaWRnZSIsImlwY1JlbmRlcmVyIiwiYXJncyJdLCJtYXBwaW5ncyI6Ijs7QUFHQUEsU0FBQUEsY0FBYyxrQkFBa0IsZUFBZTtBQUFBLEVBQzNDLE1BQU0sTUFBeUM7QUFDckMsVUFBQSxDQUFDLFNBQVMsUUFBUSxJQUFJO0FBQzVCLFdBQU9DLFNBQVksWUFBQTtBQUFBLE1BQUc7QUFBQSxNQUFTLENBQUMsVUFBVUMsVUFDdEMsU0FBUyxPQUFPLEdBQUdBLEtBQUk7QUFBQSxJQUFBO0FBQUEsRUFFL0I7QUFBQSxFQUNBLE9BQU8sTUFBMEM7QUFDN0MsVUFBTSxDQUFDLFNBQVMsR0FBRyxJQUFJLElBQUk7QUFDM0IsV0FBT0QsU0FBWSxZQUFBLElBQUksU0FBUyxHQUFHLElBQUk7QUFBQSxFQUMzQztBQUFBLEVBQ0EsUUFBUSxNQUEyQztBQUMvQyxVQUFNLENBQUMsU0FBUyxHQUFHLElBQUksSUFBSTtBQUMzQixXQUFPQSxTQUFZLFlBQUEsS0FBSyxTQUFTLEdBQUcsSUFBSTtBQUFBLEVBQzVDO0FBQUEsRUFDQSxVQUFVLE1BQTZDO0FBQ25ELFVBQU0sQ0FBQyxTQUFTLEdBQUcsSUFBSSxJQUFJO0FBQzNCLFdBQU9BLFNBQVksWUFBQSxPQUFPLFNBQVMsR0FBRyxJQUFJO0FBQUEsRUFDOUM7QUFBQTtBQUFBO0FBSUosQ0FBQztBQUdELFNBQVMsU0FDTCxZQUFrQyxDQUFDLFlBQVksYUFBYSxHQUM5RDtBQUNTLFNBQUEsSUFBSSxRQUFRLENBQUMsWUFBWTtBQUM1QixRQUFJLFVBQVUsU0FBUyxTQUFTLFVBQVUsR0FBRztBQUN6QyxjQUFRLElBQUk7QUFBQSxJQUFBLE9BQ1Q7QUFDTSxlQUFBLGlCQUFpQixvQkFBb0IsTUFBTTtBQUNoRCxZQUFJLFVBQVUsU0FBUyxTQUFTLFVBQVUsR0FBRztBQUN6QyxrQkFBUSxJQUFJO0FBQUEsUUFDaEI7QUFBQSxNQUFBLENBQ0g7QUFBQSxJQUNMO0FBQUEsRUFBQSxDQUNIO0FBQ0w7QUFFQSxNQUFNLFVBQVU7QUFBQSxFQUNaLE9BQU8sUUFBcUIsT0FBb0I7QUFDeEMsUUFBQSxDQUFDLE1BQU0sS0FBSyxPQUFPLFFBQVEsRUFBRSxLQUFLLENBQUMsTUFBTSxNQUFNLEtBQUssR0FBRztBQUNoRCxhQUFBLE9BQU8sWUFBWSxLQUFLO0FBQUEsSUFDbkM7QUFBQSxFQUNKO0FBQUEsRUFDQSxPQUFPLFFBQXFCLE9BQW9CO0FBQ3hDLFFBQUEsTUFBTSxLQUFLLE9BQU8sUUFBUSxFQUFFLEtBQUssQ0FBQyxNQUFNLE1BQU0sS0FBSyxHQUFHO0FBQy9DLGFBQUEsT0FBTyxZQUFZLEtBQUs7QUFBQSxJQUNuQztBQUFBLEVBQ0o7QUFDSjtBQVFBLFNBQVMsYUFBYTtBQUNsQixRQUFNLFlBQVk7QUFDbEIsUUFBTSxlQUFlO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsR0FPdEIsU0FBUztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBb0JGLFFBQUEsU0FBUyxTQUFTLGNBQWMsT0FBTztBQUN2QyxRQUFBLE9BQU8sU0FBUyxjQUFjLEtBQUs7QUFFekMsU0FBTyxLQUFLO0FBQ1osU0FBTyxZQUFZO0FBQ25CLE9BQUssWUFBWTtBQUNaLE9BQUEsWUFBWSxlQUFlLFNBQVM7QUFFbEMsU0FBQTtBQUFBLElBQ0gsZ0JBQWdCO0FBQ0osY0FBQSxPQUFPLFNBQVMsTUFBTSxNQUFNO0FBQzVCLGNBQUEsT0FBTyxTQUFTLE1BQU0sSUFBSTtBQUFBLElBQ3RDO0FBQUEsSUFDQSxnQkFBZ0I7QUFDSixjQUFBLE9BQU8sU0FBUyxNQUFNLE1BQU07QUFDNUIsY0FBQSxPQUFPLFNBQVMsTUFBTSxJQUFJO0FBQUEsSUFDdEM7QUFBQSxFQUFBO0FBRVI7QUFJQSxNQUFNLEVBQUUsZUFBZSxrQkFBa0I7QUFDekMsV0FBVyxLQUFLLGFBQWE7QUFFN0IsT0FBTyxZQUFZLENBQUMsT0FBTztBQUNwQixLQUFBLEtBQUssWUFBWSxtQkFBbUIsY0FBYztBQUN6RDtBQUVBLFdBQVcsZUFBZSxJQUFJOyJ9
