import Faker from 'faker';
import ReactEntity from '../src/ReactEntity.jsx';

const defaultField = Faker.name.firstName();
const defaultValue = Faker.name.firstName();

class FakeEntityWithDefault extends ReactEntity {
  static SCHEMA = {
    [defaultField]: {
      type: function (){},
      defaultValue: defaultValue
    },
    [`_${defaultField}`]: {
      type: function (){},
      defaultValue: `_${defaultValue}`
    },
  }
}

class Validatable extends ReactEntity {
  static SCHEMA = {
    field: function (data, propName, entityName){
      if(data[propName] !== 'valid'){
        return `${propName} wrong on ${entityName}`;
      }
    },
    otherField: {
      type: function (data, propName, entityName){
        if(data[propName] !== 'valid'){
          return new Error(`${propName} wrong on ${entityName}`);
        }
      },
      defaultValue: 'bla'
    }
  }
}

describe('ReactEntity', function (){
  it('should merge with default data', function (){
    const fakeEntity = new FakeEntityWithDefault();

    expect(fakeEntity[defaultField]).toBe(defaultValue);
  });

  it('should clean data on fetch', function (){
    const fakeEntity = new FakeEntityWithDefault({
      fakeAttribute: 'should not come'
    });

    expect(fakeEntity.fetch()).toEqual({
      [defaultField]: defaultValue,
      [`_${defaultField}`]: `_${defaultValue}`
    });
  });

  it('should create set for property and call validate when change', function (){
    const fakeEntity = new FakeEntityWithDefault();
    spyOn(fakeEntity, 'validate');

    fakeEntity[`_${defaultField}`] = `_${defaultValue}`;
    expect(fakeEntity.validate).not.toHaveBeenCalled();

    fakeEntity[`_${defaultField}`] = defaultValue;
    expect(fakeEntity.validate).toHaveBeenCalled();
  });

  it('should not use defaultValue when a value is passed', function (){
    const newValue = Faker.name.findName();
    const fakeEntity = new FakeEntityWithDefault({
      [defaultField]: newValue
    });

    expect(fakeEntity[`_${defaultField}`]).toBe(`_${defaultValue}`);
    expect(fakeEntity[defaultField]).toBe(newValue);
  });

  it('should validate when build', function (){
    // given
    spyOn(Validatable.SCHEMA, 'field').and.returnValue(null)
    spyOn(Validatable.SCHEMA.otherField, 'type').and.returnValue(null)

    // when
    new Validatable({
      field: 'value',
      noField: 'should not go'
    });

    // then
    expect(Validatable.SCHEMA.field).toHaveBeenCalledWith(
      { field: 'value', otherField: 'bla' },
      'field',
      'ValidatableEntity'
    );
    expect(Validatable.SCHEMA.otherField.type).toHaveBeenCalledWith(
      { field: 'value', otherField: 'bla' },
      'otherField',
      'ValidatableEntity'
    );
  });

  it('should auto validate', function (){
    // when
    const entity = new Validatable({ field: 'invalid', otherField: 'invalid'});

    expect(entity.valid).toBe(false);
    entity.field = 'valid';

    expect(entity.valid).toBe(false);
    entity.otherField = 'valid';
    expect(entity.valid).toBe(true);
  });
});
