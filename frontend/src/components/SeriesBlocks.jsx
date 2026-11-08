import { MAX_BLOCKS } from '../lib/workout.js'
import { Plus, Trash } from './Icons.jsx'
import MiniSteppers from './MiniSteppers.jsx'

// Blocos de séries de um exercício. Cada bloco tem séries, repetições e peso próprios, para
// registrar, por exemplo, 1 série com 20 kg e 3 séries com 40 kg.
export default function SeriesBlocks({ item, idPrefix, disabled = false, onValue, onAdd, onRemove }) {
  const many = item.blocks.length > 1
  return (
    <div className="blocks">
      {item.blocks.map((block, index) => (
        <div key={block.key} className="block">
          {many && (
            <div className="block__head">
              <span className="micro">Bloco {index + 1}</span>
              <button
                type="button"
                className="icon-btn icon-btn--sm icon-btn--danger"
                onClick={() => onRemove(block.key)}
                disabled={disabled}
                aria-label={`Remover bloco ${index + 1} de ${item.name}`}
              >
                <Trash size={16} />
              </button>
            </div>
          )}
          <MiniSteppers
            idPrefix={`${idPrefix}-${block.key}`}
            values={block.values}
            disabled={disabled}
            onChange={(field, text) => onValue(block.key, field, text)}
          />
        </div>
      ))}
      {item.blocks.length < MAX_BLOCKS && (
        <button type="button" className="btn btn--ghost btn--sm blocks__add" onClick={onAdd} disabled={disabled}>
          <Plus size={16} />
          Série com outro peso
        </button>
      )}
    </div>
  )
}
