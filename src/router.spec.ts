import test from 'ava'

import { hawtioBackend } from './router'

test('hawtioBackend', (t) => {
  t.not(hawtioBackend(), null)
})
