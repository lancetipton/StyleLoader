const StyleLoader = require('../loader')
const Properties = require('../properties')
const noUnitProps = Properties.default.noUnits

let sLoad = new StyleLoader.default() 
const styleObj = { 
  '.my-color': {
    color: "#111111",
    '.first-level': {
      backgroundColor: '#2f2f2f',
      marginTop: 10
    }
  },
  
  '.my-color .first-level': {
    marginTop: "40px",
    '.second-level': {
      marginLeft: 31,
    } 
  }
}

let styleElCss = { styleSheet: { cssText: '' } }
let styleElHtml = { innerHTML: '' }

const cleanIt = () => {
  sLoad = new StyleLoader.default()
  jest.clearAllMocks()
  styleElCss = { styleSheet: { cssText: '' } }
  styleElHtml = { innerHTML: '' }
}

describe('StyleLoader', () => {
  
  beforeEach(() => cleanIt())
  
  describe('add', () => {

    beforeEach(() => cleanIt())

    it('should call the `sLoad.build` method with the passed in style object', () => {
      sLoad.build = jest.fn(() => {})
      sLoad.set = jest.fn(() => {})
      sLoad.add('1234', styleObj)
      expect(sLoad.build).toHaveBeenCalledWith(styleObj)
    })

    it('should call `sLoad.set` with passed in id, and resp from `sLoad.build`', () => {
      const orgBuild = sLoad.build
      let buildRes
      sLoad.build = jest.fn(obj => {
        buildRes = orgBuild(obj)
        return buildRes
      })
      sLoad.set = jest.fn(() => {})
      sLoad.add('1234', styleObj)
      expect(sLoad.set).toHaveBeenCalledWith('1234', buildRes)
    })

  })

  describe('get', () => {

    beforeEach(() => cleanIt())

    it('should create the `sLoad.sheetCache` if it does not exist', () => {
      expect(sLoad.sheetCache).toBe(undefined)
      sLoad.get('1234')
      expect(typeof sLoad.sheetCache).toEqual('object')
    })

    it('should create a new style sheet if it does not exist in cache', () => {
      expect(sLoad.sheetCache).toBe(undefined)
      expect(sLoad.get('1234')).toEqual(sLoad.sheetCache['1234'])
    })

    it('should create the style dom node and add it to the document head', () => {
      const oldCreate = document.createElement
      const oldAppend = document.head.appendChild
      document.createElement = jest.fn(() => { return {} })
      document.head.appendChild = jest.fn(() => { })
      sLoad.get('1234')
      expect(document.createElement).toHaveBeenCalled()
      expect(document.head.appendChild).toHaveBeenCalled()
      document.createElement = oldCreate
      document.head.appendChild = oldAppend
    })
  })

  describe('set', () => {

    beforeEach(() => cleanIt())
    
    it('should create the `sLoad.sheetCache` if it does not exist', () => {
      const orgGet = sLoad.get
      sLoad.get = jest.fn(() => { return styleElCss })
      expect(sLoad.sheetCache).toBe(undefined)
      sLoad.set('1234', '.my-style { color: #ffffff; }')
      expect(typeof sLoad.sheetCache).toEqual('object')
    })

    it('should call `sLoad.get` with passed in id and set cssText property', () => {
      const orgGet = sLoad.get
      sLoad.get = jest.fn(id => { return styleElCss })
      sLoad.sheetCache = { ['1234']: styleElCss }  
      const myStyle = '.my-style { color: #ffffff; }'
      sLoad.set('1234', myStyle)
      expect(styleElCss.styleSheet.cssText).toEqual(myStyle)
    })

    it('should set the innerHtml prop, if the cssText prop does not exist', () => {
      const orgGet = sLoad.get
      sLoad.get = jest.fn(id => { return styleElHtml })
      sLoad.sheetCache = { ['1234']: styleElHtml }
      const myStyle = '.my-style { color: #ffffff; }'
      sLoad.set('1234', myStyle)
      expect(styleElCss.styleSheet.cssText).toEqual('')
      expect(styleElHtml.innerHTML).toEqual(myStyle)
    })

  })

  describe('build', () => {

    beforeEach(() => cleanIt())

    it('should convert the passed in object into formatted css text', () => {
      const stylStr = sLoad.build(styleObj)
      expect(typeof stylStr).toBe('string')
    })

    it('should convert sub classes into qulified css rules', () => {
      const styles = { 
        ['.my-style']: {
          myStyleRule: 15,
          ['.first-level']: {
            ['.sub-first-level']: { paddingBottom: 15 }
          }
        }
      }
      const subSelector = '.my-style .first-level .sub-first-level {'
      const stylStr = sLoad.build(styles)
      expect(stylStr.indexOf(subSelector)).not.toBe(-1)
    })

    it('should convert numbers and camelcase into proper format', () => {
      const styles = { ['.my-style']: { myStyleRule: 15 } }
      const stylStr = sLoad.build(styles)
      expect(stylStr.indexOf('my-style-rule: 15px;')).not.toBe(-1)
    })

    it('should not add px to rules in the properties object', () => {
      const styles = { ['.my-style']: {} }
      Object.keys(noUnitProps).map((key, index) => (styles['.my-style'][key] = index))
      const stylStr = sLoad.build(styles)
      expect(stylStr.indexOf('px;')).toBe(-1)
    })

  })

  describe('destroy', () => {

    beforeEach(() => cleanIt())

    it('should call `sLoad.remove` for all cached style sheets`', () => {
      sLoad.sheetCache = { ['1234']: styleElHtml, ['4321']: styleElCss }
      const oldRemove = sLoad.remove
      sLoad.remove = jest.fn()
      sLoad.destroy()
      expect(sLoad.remove).toHaveBeenCalledTimes(2)
    })

    it('should reset `sLoad.sheetCache to an empty object`', () => {
      sLoad.sheetCache = { ['1234']: styleElHtml, ['4321']: styleElCss }
      expect(Object.keys(sLoad.sheetCache).length).toBe(2)
      sLoad.remove = jest.fn(() => { return true })
      sLoad.destroy()
      expect(Object.keys(sLoad.sheetCache).length).toBe(0)
    })

  })

  describe('remove', () => {
    beforeEach(() => cleanIt())
    
    it('it should remove the domNode based on passed in id', () => {
      const oldRemove = document.head.removeChild
      document.head.removeChild = jest.fn()
      sLoad.sheetCache = { ['1234']: styleElHtml }
      sLoad.remove('1234')
      expect(document.head.removeChild).toHaveBeenCalledWith(styleElHtml)
      document.head.removeChild = oldRemove
    })

    it('it should not remove the domNode if it does not exist in cache', () => {
      const oldRemove = document.head.removeChild
      document.head.removeChild = jest.fn()
      sLoad.sheetCache = { ['4321']: styleElHtml }
      sLoad.remove('1234')
      expect(document.head.removeChild).not.toHaveBeenCalledWith(styleElHtml)
      document.head.removeChild = oldRemove
    })

    it('it should set the cached version to undefined', () => {
      const oldRemove = document.head.removeChild
      document.head.removeChild = jest.fn()
      sLoad.sheetCache = { ['1234']: styleElHtml }
      sLoad.remove('1234')
      expect(sLoad.sheetCache['1234']).toBe(undefined)
      document.head.removeChild = oldRemove
    })

    it('it should call the parentNode to remove if there is an error with document.head', () => {
      const oldRemove = document.head.removeChild
      document.head.removeChild = undefined
      styleElHtml.parentNode = { removeChild: jest.fn() }
      sLoad.sheetCache = { ['1234']: styleElHtml }
      sLoad.remove('1234')
      expect(styleElHtml.parentNode.removeChild).toHaveBeenCalled(undefined)
      document.head.removeChild = oldRemove
    })

  })
  
})