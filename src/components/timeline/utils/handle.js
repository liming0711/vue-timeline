import moment from 'moment';

const MINUTE_IN_HOUR = 60; // 1小时有60分钟标志位
const MILLISECONDS_IN_MINUTE = 60 * 1000; // 1分钟有60000毫秒标志位

// 将参数传过来的 now 处理成有效的当前时间，使之与 space 对齐
const getValidNow = function (now, minSpace) {
  return now - moment(now).format('mm') % minSpace * MILLISECONDS_IN_MINUTE;
};
// 获取时间轴的持续时间
// 开始时间非整数时，因为前后占位符的原因持续时间会比 range 多出一个小时
const getDuration = function (array, notFromZero) {
  return array ? Math.abs(array[1] - array[0]) + (notFromZero ? 1 : 0) : 0;
};

const paramValidate = function (range, space, spaceList) {
  let valid = true;
  if (range[0] >= range[1]) {
    valid = false;
    throw new Error('结束时间不能小于开始时间');
  }
  if (getDuration(range) < 2) {
    valid = false;
    throw new Error('持续时间不能少于2小时');
  }
  // space 之和必需和 range 相等
  if ([space[spaceList[0]][0], space[spaceList[spaceList.length - 1]][1]].toString() !== range.toString()) {
    valid = false;
    throw new Error('时间间隔的区间之和必需和时间区间相等');
  }
  if (spaceList.length > 1) {
    for (let i = 1, len = spaceList.length; i < len; i++) {
      if (space[spaceList[i]][0] !== space[spaceList[i - 1]][1]) {
        valid = false;
        throw new Error('时间间隔的区间必须连贯');
      }
      if (spaceList[i] % 60) {
        valid = false;
        throw new Error('时间间隔必须是小时的倍数');
      }
    }
  }
  return valid;
};

export const handle = (now, range, space) => {
  if (!isNaN(space)) {
    let newSpace = {};
    newSpace[space] = range;
    space = newSpace;
  }
  let spaceList = Object.keys(space).sort((a, b) => { return a - b; });

  if (!paramValidate(range, space, spaceList)) {
    return false;
  }

  let minSpace = +spaceList[0];
  let maxSpace = +spaceList[spaceList.length - 1];
  let validNow = getValidNow(now, minSpace); // 获取修正后的当前时间
  let validStart = validNow - Math.abs(range[0]) * MINUTE_IN_HOUR * MILLISECONDS_IN_MINUTE; // 获取时间轴的有效开始时间（不含占位符）
  let minuteAtStart = +moment(validStart).format('mm'); // 开始时间的分钟数

  let timeList = []; // 有效时间数组
  let timeStrList = [];
  let dateList = []; // 日期数组
  let firstPlaceholderIndex = minuteAtStart / minSpace; // 最开始占位符索引

  let start = validStart - minSpace * MILLISECONDS_IN_MINUTE * firstPlaceholderIndex; // 获取时间轴的开始时间（含占位符）
  let timestamp = 0;
  let dateStr = '';

  const setDateList = function (time) {
    dateStr = moment(time).format('YYYY-MM-DD');
    if (!dateList.find(a => { return a.key === dateStr; })) {
      dateList.push({
        key: dateStr,
        length: 1
      });
    } else {
      dateList[dateList.length - 1].length++;
    }
  };

  for (let i = 0; i < spaceList.length; i++) {
    for (let j = 0, len = getDuration(space[spaceList[i]], minuteAtStart) * MINUTE_IN_HOUR / spaceList[i]; j < len; j++) {
      timestamp = (start + getDuration(space[spaceList[i - 1]], minuteAtStart) * MINUTE_IN_HOUR * MILLISECONDS_IN_MINUTE) + spaceList[i] * MILLISECONDS_IN_MINUTE * j;
      timeList.push(timestamp);
      timeStrList.push(moment(timestamp).format('YYYY-MM-DD HH:mm'));
      setDateList(timestamp);
    }
  }

  return {
    now: validNow,
    timeList: timeList,
    timeStrList: timeStrList,
    dateList: dateList,
    firstPlaceholderIndex: firstPlaceholderIndex,
    lastPlaceholderIndex: timeList.length - (minuteAtStart ? (60 - minuteAtStart) / maxSpace - 1 : 0) // 最后占位符索引
  };
};
