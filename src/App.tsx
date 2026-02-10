import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";

import Join from "./Pages/Join";
import LT1 from "./Pages/LT1";
import LT1Register from "./Pages/LT1Register";
import VotePresenter from "./Pages/VotePresenter";

const isVotePageEnabled = import.meta.env.VITE_LT1_VOTE_ENABLED === "true";

type RouteMeta = {
  title?: string;
  navLabel?: string;
  visibleInNav?: boolean;
  protected?: boolean;
}

type RouteType = {
  path: string;
  element: React.ReactNode;
  meta?: RouteMeta;

  children?: Array<RouteType>;
}

export const routes: Array<RouteType> = [
  { 
    path: "/", element: <Navigate to="/events/lt-1" replace />, 
    meta: { visibleInNav: false } 
  },
  { 
    path: "/join", element: <Join />, 
    meta: { title: "Join", navLabel: "Join", visibleInNav: true } 
  },
  {
    "path": "events", element: <Navigate to="/events/lt-1" replace />,
    meta: { visibleInNav: false },
    children: [
      {
        path: "lt-1", element: <LT1 />,
        meta: { title: "LT1", navLabel: "LT1", visibleInNav: true },
        children: [
          {
            path: "register", element: <LT1Register />,
            meta: { title: "LT1 Register", visibleInNav: false }
          },
          {
            path: "vote/presenter",
            element: isVotePageEnabled ? <VotePresenter /> : <Navigate to="/events/lt-1" replace />,
            meta: { title: "Vote Presenter", visibleInNav: false }
          }
        ]
      }
    ]
  },
]

// build a normalized full path for child routes and flatten the tree
function joinPaths(parent: string, child: string) {
  if (child === "/") return "/";
  if (child.startsWith("/")) return child;
  const p = parent === "" || parent === "/" ? "" : parent;
  return `${p}/${child}`.replace(/\/+/g, "/");
}

function flattenRoutes(route: RouteType, parent = ""): Array<RouteType> {
  const fullPath = joinPaths(parent, route.path);
  const me: RouteType = { path: fullPath, element: route.element, meta: route.meta };
  const kids = route.children ? route.children.flatMap((child) => flattenRoutes(child, fullPath)) : [];
  return [me, ...kids];
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {routes.flatMap((route) => flattenRoutes(route, "")).map((r) => (
          <Route key={r.path} path={r.path} element={r.element} />
        ))}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
