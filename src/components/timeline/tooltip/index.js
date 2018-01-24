import Tooltip from './tooltip';

Tooltip.install = function (Vue) {
  Vue.component(Tooltip.name, Tooltip);
};

export default Tooltip;
