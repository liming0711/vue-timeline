import Velocity from 'velocity-animate';

const ANIMATION_SPEED = 400;

export default {
  methods: {
    // 时间轴控制器过渡动画
    beforeEnterControl: function (el) {
      el.style.opacity = 0;
      el.style.width = 0;
    },
    enterControl: function (el, done) {
      Velocity(
        el,
        { opacity: 1, width: '32px' },
        { duration: ANIMATION_SPEED, complete: done }
      );
    },
    leaveControl: function (el, done) {
      Velocity(
        el,
        { opacity: 0, width: 0 },
        { duration: ANIMATION_SPEED, complete: done }
      );
    },
    // 时间轴的主体部分过渡动画
    beforeEnterTime: function (el) {
      el.style.opacity = 0;
      el.style.width = 0;
    },
    enterTime: function (el, done) {
      Velocity(
        el,
        { opacity: 1, width: `${this.datetimeWidth}px` },
        { duration: ANIMATION_SPEED, complete: done }
      );
    },
    leaveTime: function (el, done) {
      this.datetimeWidth = el.offsetWidth;
      Velocity(
        el,
        { opacity: 0, width: 0 },
        { duration: ANIMATION_SPEED, complete: done }
      );
    }
  }
};
