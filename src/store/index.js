import { createStore } from 'vuex';

export default createStore({
    state: {
        userInfo: {},
    },
    getters: {
        userInfo: state => state.userInfo
    },
    mutations: {
        changeUserInfo(state, payload) {
            state.useInfo = payload;
        }
    },
    actions: {
        EDIT_USER_INFO({ commit }, payload) {
            commit('changeUserInfo', payload || {});
        }
    },
    modules: {}
});
