## vue3 简单的登录demo
- 使用了vue3 + vue-router(4.x) + vuex(4.x) + Element3
- 主要的功能有登录的逻辑 和 简单的登录鉴权
### 项目搭建
#### 创建项目（vue3）
- 首先要确保安装最新的脚手架，如果没有安装，可按一下操作来升级：
    - npm install -g npm     // 升级npm 到最新的版本
    - npm uninstall -g @vue/cli  // 删除旧的脚手架
    - npm install -g @vue/cli // 安装最新的脚手架
- 在terminal运行 __vue create project-name__，接着会出现下图：
#### 安装Element3
- 官方地址: <https://element3-ui.com/>
- 安装步骤（全部导入方式）
    - 在项目的根目录运行 npm install element3 -S
    - 在mian.js 文件添加如下代码，
    ```javascript
        import { createApp } from 'vue'
        import App from './App.vue'
        // 下面这两行代码是要自己去添加的
        import Element3 from 'element3'
        import 'element3/lib/theme-chalk/index.css'

        // 最后以插件的方式挂载
        createApp(App).use(Element3).mount('#app')
    ```
    - 到此项目基本搭建完成
### 路由配置 和 中央数据配置
#### 路由配置
- 为了简单就写了两个页面，logig 和 home页面
- 主要代码如下：
```javascript
    import { createRouter, createWebHashHistory } from 'vue-router';

    const routes = [
        {
            path: '/',
            name: 'Home',
            component: import("../views/Home.vue")
        },
        {
            path: '/login',
            name: 'Login',
            component: import("../views/Login")
        },
        {
            path: "/:pathMatch(.*)*",
            redirect: to => {
                return { path: '/' };
            }
        }
    ];

    const router = createRouter({
        history: createWebHashHistory(),
        routes
    });

    export default router;
```
- 为了配合vue3，所以vue-router4 的写法也存在了一些差别，想要知道vue-router4的小伙伴可以参照我的[vue-router4](https://juejin.cn/post/6912683689725919239)
- 这里值得注意的一点是 __路由的匹配__ , __path: '/:pathMatch(.\*)\*'__ 相当于是 __path:"*"__ ,现在要匹配路由需要用正则去匹配
#### 中央数据配置（vuex）
- 主要也是写法存在差异，想要知道具体用法可以参考[vuex4](https://juejin.cn/post/6912695788351160333)
- 代码如下:
```javascript
    import { createStore } from 'vuex';

    export default createStore({
        state: {
            userInfo: JSON.parse(sessionStorage.getItem('useInfo') || '{}'),
        },
        getters: {
            userInfo: state => state.userInfo
        },
        mutations: {
            changeUserInfo(state, payload) {
                state.userInfo = payload;
            }
        },
        actions: {
            EDIT_USER_INFO({ commit }, payload) {
                return new Promise((res,rej)=>{
                    commit('changeUserInfo', payload || {});
                    sessionStorage.setItem('useInfo', JSON.stringify(payload));
                    res(12233);
                })
            }
        },
        modules: {}
    });

```
- 然后，在main.js文件中统一以插件的方式挂载即可

### 页面的编写
#### 登录页
- 因为主要的功能都在登录页，所以就以登录页为主，看一下vue3页面的基本结构和Element3的基本使用
```javascript
<template>
    <div class="login">
        <div class="container">
            <el-form ref="formRef" :rules="rules" :model="form">
                <el-form-item label="用户名" prop="userName">
                    <el-input v-model="form.userName"></el-input>
                </el-form-item>
                <el-form-item label="密码" prop="password">
                    <el-input type="password" v-model="form.password"></el-input>
                </el-form-item>
            </el-form>
            <el-row type="flex" justify="center">
                <el-button type="primary" @click="submit"> 登录</el-button>
            </el-row>
        </div>
    </div>
</template>

<script>
    import { reactive, ref } from "vue";
    import { useRouter } from "vue-router";
    import { useStore } from "vuex";

    export default {
        name: 'Login',
        setup() {
            const formRef = ref(null);
            const router = useRouter();
            const store = useStore();
            const form = reactive({
                userName: '',
                password: '',
            });
            const rules = reactive({
                userName: [{ required: true, message: '请填写用户名', trigger: ['blur', 'change'] }],
                password: [{ required: true, message: '请填写密码', trigger: ['blur', 'change'] }]
            });

            const submit = () => {
                formRef.value.validate(async valid => {
                    if (!valid) return;
                    await store.dispatch('EDIT_USER_INFO', form);
                    router.push({
                        path: '/'
                    });
                });
            };
            return {
                form,
                rules,
                formRef,
                submit,
            };
        }
    };
</script>
```
- 眨眼一看是不是vue2的结构更加工整，查找数据什么的也比较方便，比较集中
- 这个页面主要做了两件事情，登录信息存储到中央仓库 和 页面的跳转，
- 如果想看vue3更多api的基本用法，请查阅这两个笔记 [vue3 api(上)](https://juejin.cn/post/6911511088626401294)、 [vue3 api(下)](https://juejin.cn/post/6911642884802347016)

### 简单的登录权限校验
#### 主要思路
- 利用vue-router的钩子函数，__router.beforeEatch__，该函数接受3个参数:
    - to : 将要前往的路由信息
    - form : 离开路由的路由信息
    - next : 是一个方法，需不需要进入该路由，如果需要进入则:next(),如果没有写，则页面会一直处在空白页，
- 在上面的函数中我们只需要做两件事情：
    - 判断用户是否登录
    - 根据登录态跳转到不同的路由即可
#### 代码展示
- 写的比较简单：
```javascript
    import router from './router/index';
    import store from './store/index';

    router.beforeEach((to, from, next) => {
        const { userInfo } = store.getters;
        if (Object.keys(userInfo).length) {
            // 已登录
            if (to.name === 'Login') {
                next({
                    name: 'Home'
                });
            }
            next();
        } else {
            // 未登录
            if (to.name === 'Login') next();
            next({
                name: 'Login'
            });
        }
    });
```


### 最后
- 本文的源码：<https://github.com/migranWorker/vue3-login>
- 刚开始写博客，有不正确的地方请及时指出，我会在第一时间进行修改，如果能给个赞就更加好了，谢谢观看！
