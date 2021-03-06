const createGetterAndSetter = function (instance, field){
  return {
    set: function (value){
      if(instance.data[field] !== value) {
        instance.data[field] = value;
        instance.validate();
      }
    },
    get: function (){ return instance.data[field]; },
    enumerable: true
  }
}

export default class ReactEntity {
  constructor(data){
    Object.defineProperty(this, 'schema', {
      value: this.constructor.SCHEMA,
      enumerable: false
    });

    this.errors = {};
    Object.defineProperty(this, 'data', {
      value: this.mergeDefault(data || {}),
      enumerable: false
    });

    this.validate();
  }

  mergeDefault(data){
    const newData = {};
    let field;
    for(field in this.schema){
      newData[field] = data[field] || this.schema[field].defaultValue;

      Object.defineProperty(this, field, createGetterAndSetter(this, field));
    }
    return newData;
  }

  fetch(){
    let rawData = {};
    for(let field in this.data){
       rawData[field] = this.fetchChild(this.data[field]);
    }

    return rawData;

  }

  fetchChild(fieldValue){

    if (Array.isArray(fieldValue)){
      return fieldValue.map(this.fetchChild)
    }

    if (fieldValue.fetch){
      return fieldValue.fetch();
    }

    return fieldValue

  }

  validateField(field) {
    const type = typeof(this.schema[field]) === 'function' ?
                   this.schema[field] :
                   this.schema[field].type;

    const error = type(this.data, field, this.constructor.name + 'Entity');

    if (error) {
      if (!this.errors[field]) {
        this.errors[field] = { errors : [] }
      }

      this.errors[field].errors.push(error.message || error);
    }
  }

  validate(){
    this.errors = {};

    let field;
    for(field in this.schema){
      this.validateField(field);
    }
    this.valid = Object.keys(this.errors).length === 0;
  }
}
