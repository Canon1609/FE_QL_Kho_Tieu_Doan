import assert from 'node:assert/strict'
import { validCode, validDate, positiveInteger, stockFields, apiFieldErrors } from '../src/utils/formValidation.js'
assert(validCode('PN_11')); assert(!validCode('pn_11')); assert(!validCode('a'.repeat(65)))
assert(validDate('2026-10-13')); assert(!validDate('2026-02-30')); assert(!validDate('not-date'))
for (const value of ['0', '-1', '1.5', '1e2', '9007199254740992', '']) assert(!positiveInteger(value))
assert(positiveInteger('9007199254740991'))
const item = { material_id: '1', source_id: '2', quantity: '5' }
const receipt = { code: 'PN_11', receipt_date: '2026-10-13', items: [item] }
assert.deepEqual(stockFields(receipt), {})
assert.equal(stockFields({ ...receipt, items: [{ ...item, quantity: '1.5' }] })['items.0.quantity'].includes('nguyên dương'), true)
assert(stockFields({ ...receipt, code: 'bad', receipt_date: '2026-02-30', items: [{}] }).code)
assert.deepEqual(stockFields({ ...receipt, transfer_date: '2026-10-13', company_unit_id: '1', to_location_id: '3' }, { transfer: true, type: 'ISSUE' }), {})
assert(stockFields({ ...receipt, transfer_date: '2026-10-13', company_unit_id: '1', from_location_id: '3', to_location_id: '3' }, { transfer: true, type: 'INTERNAL_TRANSFER' }).to_location_id)
assert(apiFieldErrors({ response: { status: 409, data: { message: 'Username already exists' } } }, 'account').username)
console.log('Form validation checks PASS')
