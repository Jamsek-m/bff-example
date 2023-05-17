const e = React.createElement;
const appElem = document.getElementById("app");
const appRoot = ReactDOM.createRoot(appElem);

async function loadUserProfile() {
    const resp = await fetch("/profile", {
        method: "GET",
    });
    
    if (resp.ok) {
        const payload = await resp.json();
        return {
            id: payload["sub"],
            name: payload["name"]
        };
    } else {
        console.error(`${resp.status} ${resp.statusText}`);
        throw new Error(`${resp.status} ${resp.statusText}`);
    }
}

function Status(props) {
    const {isAuthenticated} = props;
    return e("span", null, isAuthenticated ? "AUTHENTICATED" : "NOT AUTHENTICATED");
}

function User(props) {
    const {id, name} = props;
    return e("span", null, `${name} (${id})`);
}

function Actions(props) {
    const {isAuthenticated} = props;
    return e("a", {
        href: isAuthenticated ? "/logout" : "/login",
    }, isAuthenticated ? "LOG OUT" : "LOG IN");
}

function AppRoot() {
    const [state, setState] = React.useState({auth: false});
    
    React.useEffect(() => {
        loadUserProfile().then(user => {
            setState({
                auth: true,
                ...user,
            });
        }).catch(() => {
            setState({
                auth: false,
            });
        });
    }, []);
    
    return e("div", null,
        e("div", null,
            e("div", {className: "status"},
                e("span", null, "Status: "),
                e(Status, {isAuthenticated: state.auth}),
            ),
            state.auth ?
                e("div", {className: "status"},
                    e("span", null, "User: "),
                    e(User, {...state}),
                ) : null,
            e("div", null, e(Actions, {isAuthenticated: state.auth})),
        ),
    );
}

appRoot.render(e(AppRoot));
