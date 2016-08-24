//创建组件的时候，要继承Component类，因此要将该属性保存下来方便使用
const { Component } = React;
//为了方便使用render方法，我们可以将ReactDOM中的render保存下来
const { render } = ReactDOM;

//封装一个ajax，异步请求数据
const Util = {
    ajax (url , callback){
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function (){
            //判断readystate状态4,并且status是200
            if(xhr.readyState == 4){
                if(xhr.status == 200){
                    //将字符串转换为对象
                    var obj = JSON.parse(xhr.responseText)
                    callback(obj)
                }
            }
        }
        xhr.open('GET' , url , true);
        xhr.send(null)
    },

    //将{a:1,b:2} 转化成 ?a=1&b=2
    objToQuery (obj){
        let query = '';
        for(var i in obj){
            query += '&' + i + '=' + obj[i]
        }
        return '?' + query.slice(1)
    }
}

//定义list组件
class List extends Component {
    showDetail (e){
        var id = e.currentTarget.getAttribute('data-id')
        // console.log(id);
        this.props.openDetail(id);
    }
    getList (){
        let self = this;
        return this.props.list.map(function (value , index){
            let content = {
                __html : value.content + '<span>评论：' + value.comment + '</span>'
            }
            return (
                <li key={index} data-id={value.id} onClick={self.showDetail.bind(self)}>
                    <img src={value.img} alt="" />
                    <h2>{value.title}</h2>
                    <p dangerouslySetInnerHTML={content}></p>
                </li>
            )
        })
    }
    render () {
        return (
            <ul className='list'>{this.getList()}</ul>
        )
    }
}

//定义Detail组件
class Detail extends Component {
    showComment (){
        //像父组件传递消息，要把新闻的id传递给父组件，id可以通过属性的data属性获取
        this.props.openComment(this.props.data.id)
    }
    render () {
        //将props.data保存下来，方便下面使用
        let data = this.props.data;
        let content = {
            __html : data.content
        }
        return (
            <div className='detail'>
                <h1>{data.title}</h1>
                <p className='data'>{data.time} <span className='data-comment'>{'评论：' + data.comment}</span></p>
                <img src={data.img} alt="" />
                <p dangerouslySetInnerHTML={content} className='content'></p>
                <div className="show-more-comment" onClick={this.showComment.bind(this)}>查看更多评论</div>
            </div>
        )
    }
}

//定义Comment组件
class Comment extends Component {
    constructor (props){
        super(props);
        this.state = {
            list : this.props.data.list
        }
    }
    //当父组件再次更新组件的时候，进入的是存在期，此时没有更新state，所以我们要主动的修改state
    componentWillReceiveProps(nextProps){
        this.state = {
            list : nextProps.data.list
        }
    }
    //渲染列表
    getList (){
        return this.state.list.map(function (value , index){
            return (
                <li key={index}>
                    <h3>{value.user}</h3>
                    <p className='content'>{value.content}</p>
                    <p className='date'>{value.time}</p>
                </li>
            )
        })
    }
    //添加新的评论
    addComment (){
        let self = this;
        // 检测输入的值是否为空，如果为空我们就取消添加操作
        var val = this.refs.commentInput.value;
        if(val == '') return;
        var date = new Date();
        //创建评论
        var obj = {
            user : '邂逅、',
            //评论的内容
            content : val,
            //评论时间
            time : date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds()
        }
        //提交异步接口，将obj转为query
        Util.ajax('data/addComment.json' + Util.objToQuery(obj) , function (res){
            if(res.errno == 0){
                // console.log('hello')
                // 第一步更新list数据，要对state的list属性追加新的评论，因此要获取原有的评论
                let list = self.state.list;
                //第二步追加新的评论对象
                list.push(obj);
                //第三步 更新state
                self.setState({
                    list : list
                })
            }
        })
    }
    render () {
        return (
            <div className='comment'>
                <div className="app-comment">
                    <div className="comment-container">
                        <textarea ref='commentInput' placeholder='文明上网，理性发言！'></textarea>
                    </div>
                    <span className='add-btn' onClick={this.addComment.bind(this)}>发布</span>
                </div>
                <ul>
                    {this.getList()}
                </ul>
            </div>
        )
    }
}

//创建App组件
class App extends Component {
    //设定状态来显示哪个页面
    constructor (props){
        super(props)
        this.state = {
            section : 'list',
            //存储列表页的数据
            list : [],
            detail : {},
            comment : {
                id : '',
                list : []
            }
        }
    }
    //在组件创建完成之后请求列表页的数据
    componentDidMount (){
        //备份this
        let self = this;
        //请求异步数据
        Util.ajax ('data/list.json' , function (res){
            // console.log(res)
            if(res.errno == 0){
                //将res的数据存储在状态的list属性中,更新了state，就会再次渲染组件
                self.setState({
                    list : res.data
                })
            }
        })
    }
    showDetail (id){
        let self = this;
        //根据id发送异步请求，获取数据，渲染detail页面
        Util.ajax('data/detail.json?id=' + id , function (res){
            if(res.errno == 0){
                //请求数据成功，更新状态
                //我们想显示detail页面就要将section更改成detail
                self.setState({
                    detail : res.data,
                    section : 'detail'
                })
            }
        })
    }
    showComment (id){
        let self = this;
        //请求新闻评论数据
        Util.ajax('data/comment.json' , function (res){
            if(res.errno == 0){
                //请求成功我们将res 的data数据保存在状态的comment中
                self.setState({
                    comment : res.data,
                    section : 'comment'
                })
            }
        })
    }
    goBack (){
        switch (this.state.section){
            //当前页面是详情页，我们要返回列表页，将section设置成list即可
            case 'detail':
                this.setState({
                    section : 'list'
                })
                break;
            //当前页面是评论页，我们要返回详情页，将section设置成detail
            case 'comment' :
                this.setState({
                    section : 'detail'
                })
                break;
        }
    }
    render () {
        let section = this.state.section;
        return (
            <div>
                <header className='header'>
                    <div className="go-back" onClick={this.goBack.bind(this)}>
                        <span className='arrow'></span>
                        <span className='arrow blue'></span>
                    </div>
                    <div className="login">登录</div>
                    <h1>新闻平台</h1>
                </header>
                <section style={{display : section == 'list' ? 'block' : 'none'}}>
                    <List list={this.state.list} openDetail={this.showDetail.bind(this)}></List>
                </section>
                <section style={{display : section == 'detail' ? 'block' : 'none'}}>
                    <Detail openComment={this.showComment.bind(this)} data={this.state.detail}></Detail>
                </section>
                <section style={{display : section == 'comment' ? 'block' : 'none'}}>
                    <Comment data={this.state.comment}></Comment>
                </section>
            </div>
        )
    }
}

//将组件渲染到页面
render(<App /> , document.getElementById('app'))