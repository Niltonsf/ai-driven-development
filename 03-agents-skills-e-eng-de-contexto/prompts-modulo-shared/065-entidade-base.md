```ts
export interface EntityProps {
  id?: string;
}

type EntityState<TProps extends EntityProps> = Readonly<
  TProps & { id: string }
>;

1) Transformar o código acima em apenas uma única interface chamada EntityState, que vai ter inicialmente o id do tipo string e também como um atributo opcional. Então simplificar essa parte, mantendo o EntityProps como sendo o EntityState, e mudar a classe Entity a partir dessa mudança.

2) Uma vez que os atributos props são somente leitura, é importante criar um método clone que vai receber uma parte desses dados que podem ser sobrescritos pelas classes concretas. Para que o objeto seja clonado usando os novos atributos e mesclando esses novos atributos com os atributos existentes dentro do objeto, que é o estado. Então eu vou receber um estado parcial que vai ser mesclado com o estado atual da entidade e ele vai gerar um clone, uma cópia do objeto modificado.

OBS: Eu fiz alguns ajustes manuais na entidade, então considerar o código mais atual e não desfazer os ajustes que eu fiz manualmente.