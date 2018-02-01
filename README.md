# vue-timeline-pro

> 时间轴

## Timeline Attributes

| 参数名       | 类型            |  默认值 | 是否必须 | 描述 |
| :--------:  | :-----:        | :----: | :---:   | :---: |
|supportPlay  |Boolean         |true    |否       |是否支持播放
|datePicker   |Boolean         |false   |否       |是否带日历功能
|speedSetting |Boolean         |false   |否       |是否带调整播放速度功能
|pause        |Boolean         |true    |是       |是否暂停，支持 .sync 修饰符，初始值必需为 true
|now          |Number          |        |是       |当前的毫秒数
|range        |Array           |        |是       |一个数组，第一个值是 now 向前多少小时，第二个值是 now 向后多少小时
|space        |Number, Object  |        |是       |为时间轴的最小间隔，单位是分钟
|theme        |String          |dark    |否       |主题风格，有两种风格可以选择：dark 和 light
|showTooltip  |Boolean         |true    |否       |是否显示 tooltip
|showCollapse |Boolean         |true    |否       |是否显示收起 button
|loop         |Boolean         |true    |否       |是否支持无限循环播放，如果值为 false，则在播放到时间轴结尾时自动暂停
|freeze       |Boolean         |false   |否       |是否支持改变播放区间，如果值为 false，不可以改变播放区间

## Timeline Events
| 事件名    |  回调参数            | 描述 |
| :------: | :----:              | :---: |
|current   |当前时间              |时间轴上的当前时间改变时触发
|minimum   |播放区间最小值的索引    |播放区间最小值发生变化时触发
|maximum   |播放区间最大值的索引    |播放区间最大值发生变化时触发
|time      |时间轴用到的时间数据对象 |时间轴数据初始化后触发

## Example
```Javascript
<timeline
  class="timeline-wrapper"
  :now="now"
  :range="range"
  :space="space"
  :pause.sync="pause"
  :theme="'dark'"
  datePicker
  :show-collapse="true"
  :show-tooltip="true"
  :freeze="false"
  @current="handleCurrentTime"
  @minimum="handleMinIndex"
  @maximum="handleMaxIndex"
  @time="handleTimeObj">
</timeline>

data () {
  return {
    now: new Date().getTime(),
    range: [-24, 12],
    space: 10,
    pause: true
  };
},
methods: {
  handleCurrentTime (item) {
    console.log(moment(item).format('YYYY-MM-DD HH:mm'));
  },
  handleMinIndex (index) {
    console.log('App.vue: handleFirstTime', index);
  },
  handleMaxIndex (index) {
    console.log('App.vue: handleLastTime', index);
  },
  handleTimeObj (list) {
    console.log('App.vue: handleTimeObj', list);
  }
}
```
