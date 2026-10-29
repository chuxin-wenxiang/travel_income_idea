export function calculate(x) {
  for (const k of ['days','workHours','transport','nightly','nights','food','other','setup','price','variable','hours','orders','saving','budget']) {
    if (!Number.isFinite(x[k]) || x[k] < 0) throw new Error('请填写有效的非负数字');
  }
  if(x.days<1 || x.hours<=0 || x.workHours>x.days*24 || x.nights>x.days || !Number.isInteger(x.orders)) throw new Error('请检查天数、晚数、工时和整数订单数');
  const base=x.transport+x.nightly*x.nights+x.food*x.days+x.other;
  const saving=Math.min(x.saving,x.nightly*x.nights);
  const fixed=base-saving+x.setup;
  const capacity=Math.floor(x.workHours/x.hours);
  const orders=Math.min(x.orders,capacity);
  const margin=x.price-x.variable;
  const scenario=n=>({orders:n,revenue:n*x.price,cost:fixed+n*x.variable,net:n*margin-fixed,hours:n*x.hours});
  const expected=scenario(orders);
  return {base,saving,fixed,capacity,orders,expected,zero:scenario(0),conservative:scenario(Math.floor(orders/2)),
    breakEven:margin>0?Math.ceil(fixed/margin):null,
    upfront:expected.cost, budgetGap:Math.max(0,expected.cost-x.budget),
    freeHours:Math.max(0,x.days*8-expected.hours),
    improvement:expected.net+base};
}
