import Promise from 'bluebird';

// A mock model that is used for testing. Extend your custom model from this and use it when testing
// in place of the real model.
export default class MockModel {
  constructor(models, foreignKeyNames={}) {
    this.models = []
    if (models) {
      models.forEach(this.create.bind(this));
    }
    this.foreignKeyNames = foreignKeyNames;
    this.idCounter = 0;

    // Methods that are exposed on an item.
    const that = this;
    this.methods = {
      updateAttribute(field, value) {
        this[field] = value;
        return Promise.resolve(this);
      },
      updateAttributes(props) {
        for (const key in props) {
          this.updateAttribute.apply(this, [key, props[key]]);
        }
        return Promise.resolve(this);
      },
      destroy() {
        that.models = that.models.filter(i => i.id !== this.id);
        return Promise.resolve(true);
      },
    };

    // Add all foreign key methods
    // ie, instance.upstream() and instance.fork() return the foreign-key'd records
    for (const key in this.foreignKeyNames) {
      (function(key) {
        that.methods[key] = function() {
          return that.foreignKeyNames[key].findOne({
            where: {id: this[`${key}Id`]},
          });
        };
      })(key);
    }
  }
  findOne({where}) {
    const model = this.models.find(model => {
      for (const key in where) {
        if (where[key] !== model[key]) {
          return false;
        }
      }
      return true;
    });
    return Promise.resolve(model ? this.formatModelInstance(model) : null);
  }
  find(id) {
    return Promise.resolve(this.models.find(i => i.id === id));
  }
  create(data) {
    data.id = (++this.idCounter).toString();

    // Any foriegn keys get a `Id` suffixed version too.
    for (const fkey in this.foreignKeyNames) {
      data[fkey+'Id'] = data[fkey];
    }

    // Add all the methods to this item.
    for (const method in this.methods) {
      data[method] = this.methods[method].bind(data);
    }

    this.models.push(data);
    return Promise.resolve(data);
  }
  all() {
    return Promise.all(this.models.map(this.formatModelInstance.bind(this)));
  }

  // Before returning an instance, run it through this function to populate any of the foriegn key
  // fields.
  formatModelInstance(instance) {
    const all = Object.keys(this.foreignKeyNames).reduce((acc, fkey) => {
      const Model = this.foreignKeyNames[fkey];
      return [...acc, Model.findOne({where: {id: instance[`${fkey}Id`]}}).then(data => {
        instance[fkey] = data;
      })];
    }, []);

    return Promise.all(all).then(() => {
      return instance;
    });
  }
}

