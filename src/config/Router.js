import Vue from 'vue';
import VueRouter from 'vue-router';
import Home from '@/components/Home';
import Hello from '@/components/Hello';
import Forex from '@/components/Forex';
import Activation from '@/components/Activation';
import PasswordForgotten from '@/components/PasswordForgotten';
import PasswordForgottenVerification from '@/components/PasswordForgottenVerification';
import Registration from '@/components/Registration';
import Login from '@/components/Login';
import Authenticated from '@/components/auth/Authenticated';
import UserAuthenticated from '@/components/auth/user/UserAuthenticated';
import Profile from '@/components/auth/Profile';
import AdminServerBalance from '@/components/auth/admin/AdminServerBalance';
import AdminAccountsDetail from '@/components/auth/admin/AdminAccountsDetail';
import AdminAccounts from '@/components/auth/admin/AdminAccounts';
import AdminUserAccounts from '@/components/auth/admin/AdminUserAccounts';
import AdminUserAccountsDetail from '@/components/auth/admin/AdminUserAccountsDetail';
import AdminEvents from '@/components/auth/admin/AdminEvents';
import Translation from '@/config/Translation';
import ProgressBar from '@/config/ProgressBar.js';
import Store from '@/config/Store';

Vue.use(VueRouter);

// returns a boolean, if page is unaccessible
const isUnavailableBecauseOffline = (to) => {
	// if online: always accesible
	if (!Store.state.offline) {
		return false;
	}

	let routeComponent = null;
	for (let i = 0; i < routes.length; i++) {
		let route = routes[i];
		if (route.name === to.name) {
			routeComponent = route.component;
			break;
		}
	}

	// if the "to"-component has a flag offline,
	// and it is set to true, the page is accesible
	// even though the page is offline
	if (routeComponent) {
		return !routeComponent.offline;
	} else {
		return true;
	}
};
// redirects to "home", make sure, home is offline available
const redirectBecauseUnavailable = (next) => {
	next({ path: '/' });
	Vue.toasted.global.warnNoIcon(Translation.t('toasts.offlineModeNoAccess'), { duration: 6000 });
	hideProgressBar();
};

const noAuth = (to, _from, next) => {
	if (isUnavailableBecauseOffline(to)) {
		redirectBecauseUnavailable(next);
	} else {
		next();
	}
};

const requireAuth = (to, _from, next) => {
	if (isUnavailableBecauseOffline(to)) {
		redirectBecauseUnavailable(next);
	} else {
		if (!Store.state.auth.authenticated) {
			Vue.toasted.global.warn(Translation.t('toasts.unauthorized'), { duration: 6000 });
			next({
				path: '/login',
				query: { redirect: to.fullPath }
			});
		} else {
			next();
		}
	}
};

const requireAuthAndRole = (role, to, _from, next) => {
	if (isUnavailableBecauseOffline(to)) {
		redirectBecauseUnavailable(next);
	} else {
		if (!Store.state.auth.authenticated) {
			requireAuth(to, _from, next);
		} else if (Store.state.auth.role !== role) {
			Vue.toasted.global.warn(Translation.t('toasts.forbidden'), { duration: 6000 });
			next({
				path: '/'
			});
			hideProgressBar();
		} else {
			next();
		}
	}
};
const requireAuthAndAdmin = (to, _from, next) => {
	return requireAuthAndRole('ROLE_ADMIN', to, _from, next);
};
const requireAuthAndUser = (to, _from, next) => {
	return requireAuthAndRole('ROLE_USER', to, _from, next);
};

const afterAuth = (_to, from, next) => {
	if (isUnavailableBecauseOffline(_to)) {
		redirectBecauseUnavailable(next);
	} else {
		if (Store.state.auth.authenticated) {
			next(from.path);
			hideProgressBar();
		} else {
			next();
		}
	}
};

const error404 = (to, _from, next) => {
	Vue.toasted.global.error(Translation.t('toasts.pageNotFound'), { duration: 8000 });
	next({
		path: '/'
	});
	hideProgressBar();
};

const hideProgressBar = () => {
	// the progress bar does not hide automatically, if the route remains the same
	// (e.g. when route is blocked by authorization issues and the 'to' route is the same as the 'from' route)
	// the progress bar then remain "loading", and never stop. this prevents this behavior
	setTimeout(function () {
		ProgressBar.done(true);
	}, 100);
};

// make sure to always use the beforeEnter property: if no authentication is required, use "noAuth"
// this is necessary, because noAuth checks the offline state of the application and denies access,
// if the components offline flag is not set.
const routes = [
	{ path: '/', name: 'home', component: Home, beforeEnter: noAuth },
	{ path: '/hello', name: 'hello', component: Hello, beforeEnter: noAuth },
	{ path: '/forex', name: 'forex', component: Forex, beforeEnter: noAuth },

	{ path: '/registration', name: 'registration', component: Registration, beforeEnter: noAuth },
	{ path: '/password-forgotten', name: 'password-forgotten', component: PasswordForgotten, beforeEnter: noAuth },
	{ path: '/password-forgotten-verification/:email?/:token?', name: 'password-forgotten-verification', component: PasswordForgottenVerification, props: true, beforeEnter: noAuth },
	{ path: '/activation/:email?/:token?', name: 'activation', component: Activation, props: true, beforeEnter: noAuth },
	{ path: '/login', name: 'login', component: Login, beforeEnter: afterAuth },

	{ path: '/auth/profile', name: 'profile', component: Profile, beforeEnter: requireAuth },
	{ path: '/auth/authenticated', name: 'authenticated', component: Authenticated, beforeEnter: requireAuth },

	{ path: '/auth/user/authenticated', name: 'user-authenticated', component: UserAuthenticated, beforeEnter: requireAuthAndUser },

	{ path: '/auth/admin/events', name: 'admin-events', component: AdminEvents, beforeEnter: requireAuthAndAdmin },
	{ path: '/auth/admin/server-balance', name: 'admin-server-balance', component: AdminServerBalance, beforeEnter: requireAuthAndAdmin },
	{ path: '/auth/admin/accounts', name: 'admin-accounts', component: AdminAccounts, beforeEnter: requireAuthAndAdmin },
	{ path: '/auth/admin/accounts-detail/:publicKeyClient', name: 'admin-accounts-detail', component: AdminAccountsDetail, props: true, beforeEnter: requireAuthAndAdmin },
	{ path: '/auth/admin/user-accounts', name: 'admin-user-accounts', component: AdminUserAccounts, beforeEnter: requireAuthAndAdmin },
	{ path: '/auth/admin/user-accounts-detail/:email', name: 'admin-user-accounts-detail', component: AdminUserAccountsDetail, props: true, beforeEnter: requireAuthAndAdmin },

	{ path: '*', name: 'everyOtherPage', component: Home, beforeEnter: error404 }
]

export default new VueRouter({ routes });
